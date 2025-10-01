import * as React from "react";
import * as I18Next from "i18next";
import * as ReactI18Next from "react-i18next";

type Tuple<T> = readonly [T?, ...T[]];

interface TransProps {
  components:
    | readonly React.ReactElement[]
    | { readonly [tagName: string]: React.ReactElement };
}

interface TFunction {
  (key: string, value?: Record<string, any>): string;
  rich: (
    key: string,
    value?: Record<string, any>,
    options?: TransProps,
  ) => React.JSX.Element;
}

interface UseTranslationResponse<
  Ns extends I18Next.FlatNamespace | Tuple<I18Next.FlatNamespace> | undefined,
  KPrefix extends I18Next.KeyPrefix<ReactI18Next.FallbackNs<Ns>>
> extends Omit<
    ReactI18Next.UseTranslationResponse<ReactI18Next.FallbackNs<Ns>, KPrefix>,
    "t"
  > {
  t: TFunction;
}

/**
 * Custom hook for translations.
 * @param ns Namespace or namespaces to use for translation.
 * @param options Options for the translation hook.
 * @returns An object containing the translation function `t` and other translation properties.
 */
function useTranslation<
  Ns extends
    | I18Next.FlatNamespace
    | Tuple<I18Next.FlatNamespace>
    | undefined = undefined,
  KPrefix extends I18Next.KeyPrefix<ReactI18Next.FallbackNs<Ns>> = undefined
>(
  ns?: Ns,
  options?: ReactI18Next.UseTranslationOptions<KPrefix>
): UseTranslationResponse<ReactI18Next.FallbackNs<Ns>, KPrefix> {
  const translation = ReactI18Next.useTranslation(ns, options);

  const TFunction: TFunction = (
    key: string,
    value?: Record<string, any>,
  ) => {
    return translation.t(key, value) as string;
  }

  TFunction.rich = (
    key,
    value,
    options,
  ) => {
    return (
      <ReactI18Next.Trans
        t={translation.t}
        i18n={translation.i18n}
        i18nKey={key}
        values={value}
        components={{
          italic: <i />,
          extrabold: <span className="text-foreground font-extrabold" />,
          bold: <strong className="text-foreground font-bold" />,
          semibold: <strong className="text-foreground font-semibold" />,
          medium: <span className="text-foreground font-medium" />,
          code: <code className="text-foreground font-mono bg-muted px-0.5 rounded" />,
          ...options?.components,
        }}
      />
    );
  };

  return {
    ...translation,
    t: TFunction,
  };
}

export { useTranslation };
export type { TFunction}
