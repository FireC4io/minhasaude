import { t as translate } from 'i18next';

import { DEVICE_LABELS, EXAM_TYPE_LABELS } from '../exam-labels';

// Getters: os textos são lidos na hora de desenhar, no idioma em uso.
export const EXAM_TYPE_OPTIONS = [
  {
    value: 'blood_panel' as const,
    get label() {
      return EXAM_TYPE_LABELS.blood_panel;
    },
    get description() {
      return translate('exams.upload.bloodHint');
    },
  },
  {
    value: 'bioimpedance' as const,
    get label() {
      return EXAM_TYPE_LABELS.bioimpedance;
    },
    get description() {
      return translate('exams.upload.bioHint');
    },
  },
];

export const DEVICE_OPTIONS = (['inbody', 'tanita', 'omron', 'other'] as const).map((device) => ({
  value: device,
  get label() {
    return DEVICE_LABELS[device];
  },
}));
