import { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";

// Hardcoded Google Apps Script URL
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxv7ixCbdWw4_iKpxeZN9GsQ_nQMNuy9gcsAGpSu7k3r2hydYS0A4UXWPcmraPxdXnlOw/exec";
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
