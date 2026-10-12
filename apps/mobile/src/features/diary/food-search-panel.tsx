import { INPUT_LIMITS } from '@minhasaude/shared';
import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useFoodsControllerSearch } from '@/api/generated/endpoints/foods/foods';
import type { FoodResponseDto } from '@/api/generated/models';
import { AppText } from '@/components/ui/app-text';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { useAnnounce } from '@/features/accessibility/use-announce';
import { AuthTextField } from '@/features/auth/auth-text-field';

import { describeSearchStatus } from './accessibility-labels';
import type { EntryAmount } from './food-math';
import { FoodResultRow } from './food-result-row';
import { describeAmount, type PortionLike } from './measures';
import { useRecentFoods } from './use-recent-foods';

const MIN_SEARCH_LENGTH = 2;

interface FoodSearchPanelProps {
  /** Dia anotado: os recentes vêm dos dias anteriores a ele. */
  date: string;
  /** Fica com a tela: quem troca o alimento volta para a mesma busca. */
  searchTerm: string;
  onSearchChange: (term: string) => void;
  /** `last` é a última anotação do alimento, quando ele veio dos recentes. */
  onChoose: (food: FoodResponseDto, last?: EntryAmount<PortionLike>) => void;
}

/** Busca de alimento, com os anotados recentemente enquanto nada foi digitado. */
export function FoodSearchPanel({ date, searchTerm, onSearchChange, onChoose }: FoodSearchPanelProps) {
  const { t } = useTranslation();
  const isTyping = searchTerm.trim().length >= MIN_SEARCH_LENGTH;
  const searchQuery = useFoodsControllerSearch({ q: searchTerm, limit: 20 }, { query: { enabled: isTyping } });
  const { recents } = useRecentFoods(date);
  const results = searchQuery.data?.data ?? [];
  const searchStatus = describeSearchStatus(searchTerm, searchQuery.isFetching, results.length);
  useAnnounce(searchStatus);

  return (
    <View className="flex-1 gap-3">
      <AuthTextField
        testID="diary-food-search"
        label={t('diary.search')}
        value={searchTerm}
        onChangeText={onSearchChange}
        maxLength={INPUT_LIMITS.foodSearch}
        placeholder={t('misc.foodPlaceholder')}
        returnKeyType="search"
      />
      {searchQuery.isFetching ? <LoadingIndicator label={t('diary.searching')} /> : null}
      {/* Visível e com liveRegion: quem usa leitor de tela fica sabendo
          que a busca terminou, e quantos resultados vieram. */}
      {searchStatus ? (
        <AppText variant="caption" accessibilityLiveRegion="polite" className="text-grafite">
          {searchStatus}
        </AppText>
      ) : null}

      {isTyping ? (
        <FlatList
          data={results}
          keyExtractor={(food) => food.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => <FoodResultRow food={item} onPress={() => onChoose(item)} />}
        />
      ) : (
        <FlatList
          data={recents}
          keyExtractor={(recent) => recent.food.id}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            recents.length > 0 ? (
              <AppText variant="label" accessibilityRole="header" className="text-grafite-suave">
                {t('diary.recent')}
              </AppText>
            ) : (
              <AppText className="text-grafite-suave">{t('diary.searchHelp')}</AppText>
            )
          }
          renderItem={({ item }) => (
            <FoodResultRow
              food={item.food}
              lastAmount={describeAmount(item.last)}
              onPress={() => onChoose(item.food, item.last)}
            />
          )}
        />
      )}
    </View>
  );
}
