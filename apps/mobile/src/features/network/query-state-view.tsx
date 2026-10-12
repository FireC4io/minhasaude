import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { FormError } from '@/components/ui/form-error';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { TextButton } from '@/components/ui/text-button';

import type { QueryView } from './query-view';

interface QueryStateViewProps {
  view: QueryView;
  loadingLabel: string;
  errorMessage: string;
  /** Com ele, o erro oferece "Tentar de novo". */
  onRetry?: () => void;
  loadingClassName?: string;
  /** Função: o conteúdo só é montado quando há dado. */
  children: () => ReactNode;
}

/** Carregando, erro (com "Tentar de novo" se der) ou o conteúdo, para uma consulta (`queryView`). */
export function QueryStateView({
  view,
  loadingLabel,
  errorMessage,
  onRetry,
  loadingClassName,
  children,
}: Readonly<QueryStateViewProps>) {
  const { t } = useTranslation();
  if (view === 'loading') return <LoadingIndicator label={loadingLabel} className={loadingClassName} />;
  if (view === 'data') return <>{children()}</>;
  if (!onRetry) return <FormError message={errorMessage} />;
  return (
    <View className="gap-2">
      <FormError message={errorMessage} />
      <TextButton
        label={t('common.tryAgain')}
        onPress={onRetry}
        textVariant="bodyStrong"
        textClassName="text-mamao-forte"
        className="self-start"
      />
    </View>
  );
}
