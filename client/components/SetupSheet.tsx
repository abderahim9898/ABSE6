import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t, Language } from "@/lib/translations";

interface SetupSheetProps {
  onSetup: (scriptUrl: string, sheetName: string) => void;
}

export function SetupSheet({ onSetup }: SetupSheetProps) {
  const [scriptUrl, setScriptUrl] = useState("");
  const [sheetName, setSheetName] = useState("ABSENCES");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const language: Language = 'fr';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!scriptUrl.trim()) {
      newErrors.scriptUrl = t("Google Apps Script URL is required", language);
    } else if (!scriptUrl.includes("script.google.com")) {
      newErrors.scriptUrl = t("Please enter a valid Google Apps Script deployment URL", language);
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSetup(scriptUrl, "ABSENCES");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t("Google Sheets Editor", language)}
            </h1>
            <p className="text-gray-600">
              {t("Connect to your Google Sheets via Apps Script", language)}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("Google Apps Script URL", language)}
              </label>
              <Input
                type="url"
                value={scriptUrl}
                onChange={(e) => setScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/d/..."
                className="w-full"
              />
              {errors.scriptUrl && (
                <p className="mt-1 text-sm text-red-500">{errors.scriptUrl}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                {t("Deploy your Google Apps Script as a web app and paste the deployment URL here", language)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("Sheet Name", language)}
              </label>
              <Input
                type="text"
                value={sheetName}
                disabled
                className="w-full bg-gray-100 cursor-not-allowed"
              />
              <p className="mt-2 text-xs text-gray-500">
                {t("Connected to the \"ABSENCES\" sheet in your Google Sheets file", language)}
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2"
            >
              {t("Connect & Load Data", language)}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              {t("How to set up:", language)}
            </h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="font-bold text-blue-600 min-w-5">1.</span>
                <span>{t("Create a Google Sheet with your data", language)}</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600 min-w-5">2.</span>
                <span>
                  {t("Create a Google Apps Script in Tools → Script editor", language)}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600 min-w-5">3.</span>
                <span>{t("Paste the provided Apps Script code", language)}</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600 min-w-5">4.</span>
                <span>
                  {t("Deploy as web app (New deployment → Web app) and authorize", language)}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600 min-w-5">5.</span>
                <span>{t("Copy the deployment URL and paste it above", language)}</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
