import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Language } from "../i18n";
import { localize, words } from "../i18n";
import { SiteLink } from "../SiteLink";
import type { Navigate } from "../SiteLink";
import { foundationNeighbours } from "./foundation-order";
import "./foundations.css";

export interface FoundationPageProps {
  language: Language;
  navigate: Navigate;
}

export function FoundationPage({
  current,
  title,
  lede,
  language,
  navigate,
  children,
}: FoundationPageProps & {
  /** The page's key in foundation-order. */
  current: string;
  title: string;
  lede: string;
  children?: ReactNode;
}) {
  const t = words(language);
  const rtl = language === "ar";
  const { previous, next } = foundationNeighbours(current);
  const PreviousArrow = rtl ? ArrowRight : ArrowLeft;
  const NextArrow = rtl ? ArrowLeft : ArrowRight;
  return (
    <article className="foundation-page" dir={rtl ? "rtl" : "ltr"}>
      <header className="foundation-intro">
        <h1>{title}</h1>
        <p>{lede}</p>
      </header>
      {children}
      {(previous || next) && (
        <nav
          className="foundation-pager"
          aria-label={t("الصفحة السابقة والتالية", "Previous and next pages")}
        >
          {previous && (
            <SiteLink
              className="foundation-pager-link"
              data-direction="previous"
              route={previous.route}
              navigate={navigate}
              rel="prev"
            >
              <small>{t("السابق", "Previous")}</small>
              <span>
                <PreviousArrow size={16} aria-hidden="true" />
                {localize(previous.name, language)}
              </span>
            </SiteLink>
          )}
          {next && (
            <SiteLink
              className="foundation-pager-link"
              data-direction="next"
              route={next.route}
              navigate={navigate}
              rel="next"
            >
              <small>{t("التالي", "Next")}</small>
              <span>
                {localize(next.name, language)}
                <NextArrow size={16} aria-hidden="true" />
              </span>
            </SiteLink>
          )}
        </nav>
      )}
    </article>
  );
}
