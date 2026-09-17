# Modelagem Inicial do Banco de Dados

> Convenções: `uuid` como PK em todas as tabelas, `created_at`/`updated_at` implícitos em todas, soft delete só onde indicado.

## Núcleo — usuário e nutrição

**users**
- id, email (unique), password_hash, email_verified_at, created_at
- status (active | suspended | pending_deletion)

**refresh_tokens**
- id, user_id → users, token_hash, device_info, expires_at, revoked_at

**profiles** (1:1 com users)
- user_id → users, birth_date, sex (male | female), height_cm
- activity_level (sedentary | light | moderate | active | very_active)
- goal (lose | maintain | gain), goal_updated_at

**body_measurements** (histórico — N por usuário, é a fonte tanto de peso manual quanto de bioimpedância)
- id, user_id, measured_at, source (manual | inbody | tanita | omron | other)
- weight_kg, body_fat_percent (nullable), muscle_mass_kg (nullable), lean_mass_kg (nullable)
- raw_payload (jsonb, nullable — dump bruto se vier de exame importado)
- ⚠️ `source` é obrigatório e nunca "normalizado" entre aparelhos — comparação de evolução na UI deve filtrar por mesma fonte, ou avisar explicitamente ao comparar fontes diferentes.

**goal_targets** (snapshot calculado + ajustes manuais; N por usuário ao longo do tempo, sempre criar novo em vez de sobrescrever)
- id, user_id, profile_snapshot (jsonb), calculation_method (mifflin_st_jeor | harris_benedict | katch_mcardle | cunningham)
- bmr_kcal, tdee_kcal, target_kcal
- protein_g, fat_g, carb_g
- is_manual_override (bool), created_at, active_from

## Alimentos e diário

**foods**
- id, source (taco | off | custom), external_id (nullable, ex. código EAN do OFF), owner_user_id (nullable, só se source=custom)
- name, brand (nullable), barcode (nullable, indexed)
- kcal_per_100g, protein_g_per_100g, fat_g_per_100g, carb_g_per_100g, fiber_g_per_100g (nullable)
- search_vector (tsvector, gerado) — índice GIN + pg_trgm no `name`

**food_portions** (unidades customizadas por alimento, ex. "1 fatia = 25g")
- id, food_id → foods, label, grams

**diary_entries**
- id, user_id, food_id → foods, entry_date, meal_type (breakfast | lunch | dinner | snack)
- quantity, unit (grams | portion), portion_id (nullable → food_portions)
- kcal_snapshot, protein_g_snapshot, fat_g_snapshot, carb_g_snapshot *(grava o valor nutricional no momento do registro — se o alimento for editado depois, o histórico não muda)*

## Exames e métricas de saúde (Fase 5, modelar desde já)

**exam_documents**
- id, user_id, file_key (referência no R2), mime_type, uploaded_at
- status (pending | processing | extracted | failed | reviewed)
- exam_type (blood_panel | bioimpedance | other)
- device_source (nullable — inbody | tanita | omron | lab_generic | other)

**exam_marker_catalog** (catálogo de referência, poucas linhas, mantido por seed/migration — não por usuário)
- code (PK, ex. `glucose_fasting`, `hdl`, `ldl`, `triglycerides`, `creatinine`), display_name, category (metabolic | lipid | renal | body_composition | other)
- canonical_unit (ex. `mg/dL`)

**exam_results**
- id, exam_document_id → exam_documents, marker_code → exam_marker_catalog
- raw_value, raw_unit, raw_reference_range (texto como veio do laudo) — **nunca sobrescrito**
- confirmed_value, confirmed_unit, confirmed_reference_low, confirmed_reference_high — preenchido só após revisão do usuário
- confirmed_at (nullable — null = ainda não revisado, não deve ser usado em cálculos)
- normalized_value, normalized_unit (após conversão de unidade, ex. mmol/L → mg/dL)

**calculated_metrics** (saída das calculadoras do catálogo — ver `packages/shared/calculators`)
- id, user_id, metric_code (ex. `homa_ir`, `tyg_index`, `castelli_1`, `castelli_2`, `ffmi`, `waist_height_ratio`, `ckd_epi_2021`)
- calculator_version (string, ex. `"2021.1"`) — rastreabilidade se a fórmula mudar
- value, unit, computed_at, inputs_used (jsonb — quais exam_results/body_measurements alimentaram o cálculo)

## LGPD / consentimento

**consents**
- id, user_id, consent_type (terms_of_service | privacy_policy | exam_data_processing)
- policy_version, granted_at, revoked_at (nullable), ip_address, user_agent

**account_deletion_requests**
- id, user_id, requested_at, scheduled_purge_at, completed_at (nullable)

## Catálogo de calculadoras — organização extensível

Não vive só no banco. Estrutura recomendada em `packages/shared/src/calculators/`:

```ts
interface CalculatorDefinition {
  code: string;                    // 'homa_ir'
  version: string;                 // '2021.1'
  requiredMarkers: string[];       // ['glucose_fasting', 'insulin_fasting']
  compute: (inputs: Record<string, number>) => number;
  unit: string;
  reference: string;               // citação bibliográfica
}
```

Cada calculadora é um módulo testado unitariamente com valores de referência da literatura original. O `calculated_metrics.calculator_version` grava qual versão gerou o resultado — se a fórmula for corrigida, o histórico anterior permanece íntegro e auditável.

**Fórmulas a validar/incluir** (as que você listou já são as corretas e mais citadas na literatura; adições sugeridas):
- Gasto energético: Mifflin-St Jeor (default), Harris-Benedict revisada, Katch-McArdle (requer % gordura), Cunningham (requer massa magra).
- Composição corporal: FFMI (com correção de altura), relação cintura/altura, % de variação de gordura/massa magra no período.
- Metabólico: HOMA-IR, índice TyG. Sugestão adicional: HOMA-B (função de célula beta, mesmos inputs de HOMA-IR).
- Cardiovascular: colesterol não-HDL, Castelli I e II, relação TG/HDL. Sugestão adicional: relação LDL/HDL.
- Renal: CKD-EPI 2021 (sem variável de raça, versão atualizada — correta a escolha).
