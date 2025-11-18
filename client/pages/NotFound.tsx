import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { t, Language } from "@/lib/translations";

const NotFound = () => {
  const location = useLocation();
  const [language, setLanguage] = useState<Language>('fr');

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">{t("404", language)}</h1>
        <p className="text-xl text-gray-600 mb-4">{t("Oops! Page not found", language)}</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          {t("Return to Home", language)}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
