import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { SheetData } from "@/hooks/useSheetData";
import { X, Search } from "lucide-react";
import { t, Language } from "@/lib/translations";

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SheetData | null;
  motifColIdx: number;
  dateColIdx: number;
  equipeColIdx: number;
  language: Language;
  selectedDates?: Set<string>;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
];

export function StatisticsModal({
  isOpen,
  onClose,
  data,
  motifColIdx,
  dateColIdx,
  equipeColIdx,
  language,
  selectedDates = new Set(),
}: StatisticsModalProps) {
  // Input states (not tied to calculations)
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [equipeSearch, setEquipeSearch] = useState("");

  // Applied filter states (used for calculations)
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");
  const [appliedEquipe, setAppliedEquipe] = useState("");

  // Get unique equipes for suggestions
  const uniqueEquipes = useMemo(() => {
    if (!data?.rows) return [];
    const equipes = new Set<string>();
    data.rows.forEach((row) => {
      const equipe = String(row[equipeColIdx] || "").trim();
      if (equipe) equipes.add(equipe);
    });
    return Array.from(equipes).sort();
  }, [data?.rows, equipeColIdx]);

  // Parse date string and return as YYYY-MM-DD for comparison
  const parseDateToString = (dateStr: string): string | null => {
    const str = String(dateStr).trim();

    // Handle ISO 8601 format (2025-11-16T23:00:00.000Z)
    if (str.includes("T") && (str.includes("Z") || str.includes("+"))) {
      try {
        const date = new Date(str);
        if (!isNaN(date.getTime())) {
          const year = date.getUTCFullYear();
          const month = String(date.getUTCMonth() + 1).padStart(2, "0");
          const day = String(date.getUTCDate()).padStart(2, "0");
          const formatted = `${year}-${month}-${day}`;
          console.log("Parsed ISO date:", { input: dateStr, output: formatted });
          return formatted;
        }
      } catch (e) {
        console.warn("Failed to parse ISO date:", dateStr);
      }
    }

    // Handle HTML date input format (YYYY-MM-DD)
    if (str.includes("-") && str.length === 10) {
      const parts = str.split("-");
      if (parts.length === 3) {
        const [year, month, day] = parts;
        // Ensure proper formatting
        const formatted = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        console.log("Parsed HTML date input:", { input: dateStr, output: formatted });
        return formatted;
      }
    }

    // Handle data format (DD/MM/YYYY)
    if (str.includes("/")) {
      const parts = str.split("/");
      if (parts.length === 3) {
        let day = parts[0];
        let month = parts[1];
        const year = parts[2];

        // Normalize to YYYY-MM-DD format
        day = String(day).padStart(2, "0");
        month = String(month).padStart(2, "0");
        const formatted = `${year}-${month}-${day}`;
        console.log("Parsed data date:", { input: dateStr, output: formatted });
        return formatted;
      }
    }

    console.warn("Could not parse date:", dateStr);
    return null;
  };

  // Format date for display (YYYY-MM-DD to DD/MM/YYYY)
  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return "";

    const str = String(dateStr).trim();

    // Handle YYYY-MM-DD format from date input
    if (str.includes("-") && str.length === 10) {
      const parts = str.split("-");
      if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
      }
    }

    // Already in DD/MM/YYYY format
    if (str.includes("/")) {
      return str;
    }

    return str;
  };

  // Calculate statistics based on applied filters
  const statistics = useMemo(() => {
    if (!data?.rows) return { byMotif: [], total: 0, filtered: 0 };

    let filteredRows = data.rows;

    // Filter by date range if specified in the modal (takes priority)
    if (appliedStartDate || appliedEndDate) {
      const startStr = appliedStartDate ? parseDateToString(appliedStartDate) : null;
      const endStr = appliedEndDate ? parseDateToString(appliedEndDate) : null;

      console.log("Filtering by date range:", { startStr, endStr, appliedStartDate, appliedEndDate });

      filteredRows = filteredRows.filter((row) => {
        const rowDateStr = parseDateToString(String(row[dateColIdx]));
        if (!rowDateStr) {
          console.warn("Could not parse row date:", row[dateColIdx]);
          return false;
        }

        // Compare dates as strings (YYYY-MM-DD format) for consistency
        const matches = (!startStr || rowDateStr >= startStr) && (!endStr || rowDateStr <= endStr);
        if (!matches) {
          console.log("Date mismatch:", { rowDate: row[dateColIdx], rowDateStr, startStr, endStr });
        }
        return matches;
      });

      console.log("Rows after date filter:", filteredRows.length);
    }
    // Otherwise, filter by selected dates from DataTable filter if provided
    else if (selectedDates.size > 0) {
      filteredRows = filteredRows.filter((row) => {
        const rowDate = String(row[dateColIdx]);
        return selectedDates.has(rowDate);
      });
    }

    // Filter by equipe if specified
    if (appliedEquipe) {
      filteredRows = filteredRows.filter((row) => {
        const equipe = String(row[equipeColIdx] || "").trim();
        return equipe.toLowerCase().includes(appliedEquipe.toLowerCase());
      });
    }

    // Count by motif
    const motifCounts: Record<string, number> = {};
    filteredRows.forEach((row) => {
      const motif = String(row[motifColIdx] || "Unknown").trim();
      motifCounts[motif] = (motifCounts[motif] || 0) + 1;
    });

    const byMotif = Object.entries(motifCounts)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);

    return {
      byMotif,
      total: data.rows.length,
      filtered: filteredRows.length,
    };
  }, [data, motifColIdx, dateColIdx, equipeColIdx, appliedStartDate, appliedEndDate, appliedEquipe, selectedDates]);

  const handleApplyFilters = () => {
    setAppliedStartDate(startDateInput);
    setAppliedEndDate(endDateInput);
    setAppliedEquipe(equipeSearch);
  };

  const handleClearFilters = () => {
    setStartDateInput("");
    setEndDateInput("");
    setEquipeSearch("");
    setAppliedStartDate("");
    setAppliedEndDate("");
    setAppliedEquipe("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t("Absence Statistics", language)}</DialogTitle>
          <DialogDescription>
            {t("Overview of absences by type and date range", language)}
          </DialogDescription>
        </DialogHeader>

        {/* Filters Section */}
        <div className="space-y-4 mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-3">{t("Filter Statistics", language)}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("Start Date", language)}
              </label>
              <input
                type="date"
                value={startDateInput}
                onChange={(e) => setStartDateInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("End Date", language)}
              </label>
              <input
                type="date"
                value={endDateInput}
                onChange={(e) => setEndDateInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Equipe Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("Search Equipe", language)}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={equipeSearch}
                  onChange={(e) => setEquipeSearch(e.target.value)}
                  placeholder={t("Type to search...", language)}
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />

                {/* Equipe Suggestions Dropdown */}
                {equipeSearch && uniqueEquipes.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                    {uniqueEquipes
                      .filter((e) =>
                        e.toLowerCase().includes(equipeSearch.toLowerCase())
                      )
                      .slice(0, 5)
                      .map((equipe) => (
                        <div
                          key={equipe}
                          onClick={() => setEquipeSearch(equipe)}
                          className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm text-gray-700"
                        >
                          {equipe}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleApplyFilters}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Search size={16} />
              {t("Apply Filters", language)}
            </Button>
            <Button
              onClick={handleClearFilters}
              variant="outline"
            >
              {t("Clear All", language)}
            </Button>
          </div>

          {/* Active Filters Display */}
          {(appliedStartDate || appliedEndDate || appliedEquipe) && (
            <div className="mt-3 p-2 bg-white rounded border border-blue-200 text-sm text-gray-700">
              <span className="font-semibold">{t("Active filters:", language)}</span>
              {appliedStartDate && <span className="ml-2">{t("From", language)} {formatDateForDisplay(appliedStartDate)}</span>}
              {appliedEndDate && <span className="ml-2">{t("To", language)} {formatDateForDisplay(appliedEndDate)}</span>}
              {appliedEquipe && <span className="ml-2">{language === 'en' ? 'Equipe' : 'Équipe'}: {appliedEquipe}</span>}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-6">
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">{t("Total Absences", language)}</p>
              <p className="text-2xl font-bold text-blue-600">{statistics.total}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t("In Selected Range", language)}</p>
              <p className="text-2xl font-bold text-green-600">{statistics.filtered}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t("Absence Types", language)}</p>
              <p className="text-2xl font-bold text-purple-600">{statistics.byMotif.length}</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-8 mt-8">
          {/* Bar Chart */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t("Absences by Type (Bar Chart)", language)}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statistics.byMotif}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          {statistics.byMotif.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t("Absences Distribution (Pie Chart)", language)}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statistics.byMotif}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statistics.byMotif.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Detailed Table */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t("Detailed Breakdown", language)}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      {t("Absence Type", language)}
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-900">
                      {t("Count", language)}
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-900">
                      {t("Percentage", language)}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.byMotif.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-right text-gray-900 font-semibold">
                        {item.value}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {statistics.filtered > 0
                          ? ((item.value / statistics.filtered) * 100).toFixed(1)
                          : 0}
                        %
                      </td>
                    </tr>
                  ))}
                  {statistics.byMotif.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-center text-gray-500">
                        {t("No data available for the selected date range", language)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end gap-2 mt-8 pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            {t("Close", language)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
