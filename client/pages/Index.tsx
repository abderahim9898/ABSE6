import { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";

// Hardcoded Google Apps Script URL
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzSH0UGd5pTbkCz59HeqarYsEajxybWtHJYB5EJ8-C0JwDD3DmhROd4sVoGuqU5QeomjQ/exec";
const SHEET_NAME = "ABSENCES";

export default function Index() {
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    const systemPreference = window.matchMedia(
      "(dir: rtl)"
    ).matches;
    setIsRTL(systemPreference);
  }, []);

  return (
    <DataTable
      scriptUrl={GOOGLE_APPS_SCRIPT_URL}
      sheetName={SHEET_NAME}
      isRTL={isRTL}
    />
  );
}
