import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSheetData, SheetData } from "@/hooks/useSheetData";
import { useToast } from "@/hooks/use-toast";
import { cn, formatCellValue, formatDate } from "@/lib/utils";
import { AlertCircle, Loader, RefreshCw, ChevronLeft, X, ChevronsUpDown, Check, CheckSquare, Square, Calendar, Send, BarChart3, Globe } from "lucide-react";
import { StatisticsModal } from "@/components/StatisticsModal";
import { useLanguage } from "@/hooks/useLanguage";
import { t, Language } from "@/lib/translations";
import { parseISO, compareDesc, format } from "date-fns";
import { enUS, fr } from "date-fns/locale";

interface DataTableProps {
  scriptUrl: string;
  sheetName: string;
  isRTL?: boolean;
}

interface FilteredRow {
  row: any[];
  originalIndex: number;
}

interface FilterComboboxProps {
  label: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

interface DateFilterComboboxProps {
  label: string;
  placeholder: string;
  options: string[];
  selectedDates: Set<string>;
  onChange: (dates: Set<string>) => void;
  language: string;
}

function DateFilterCombobox({ label, placeholder, options, selectedDates, onChange, language }: DateFilterComboboxProps) {
  const [open, setOpen] = useState(false);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const checkboxRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Group dates by month
  const monthGroups = useMemo(() => {
    const groups: Record<string, string[]> = {};

    options.forEach((dateStr) => {
      const formatted = formatDate(dateStr);
      // Extract month from DD/MM/YYYY format
      const parts = formatted.split("/");
      if (parts.length === 3) {
        const monthYear = `${parts[1]}/${parts[2]}`;
        try {
          // Create a date in the middle of the month to avoid timezone issues
          const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, 15);
          const locale = language === 'fr' ? fr : enUS;
          const monthName = format(date, 'MMMM yyyy', { locale });

          if (!groups[monthYear]) {
            groups[monthYear] = [];
          }
          groups[monthYear].push(dateStr);
        } catch {
          // Fallback if parsing fails
          if (!groups[monthYear]) {
            groups[monthYear] = [];
          }
          groups[monthYear].push(dateStr);
        }
      }
    });

    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .reduce((acc, [key, dates]) => {
        const monthName = new Date(parseInt(key.split("/")[1]), parseInt(key.split("/")[0]) - 1).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' });
        acc[monthName] = dates.sort((a, b) => {
          try {
            const aDate = parseISO(String(a));
            const bDate = parseISO(String(b));
            return compareDesc(aDate, bDate);
          } catch {
            // Fallback to string comparison if dates can't be parsed
            return String(b).localeCompare(String(a));
          }
        });
        return acc;
      }, {} as Record<string, string[]>);
  }, [options, language]);

  const handleToggleDate = (dateStr: string) => {
    const newSelected = new Set(selectedDates);
    if (newSelected.has(dateStr)) {
      newSelected.delete(dateStr);
    } else {
      newSelected.add(dateStr);
    }
    onChange(newSelected);
  };

  const handleToggleMonth = (monthDates: string[]) => {
    const newSelected = new Set(selectedDates);
    const allSelected = monthDates.every(date => newSelected.has(date));

    if (allSelected) {
      monthDates.forEach(date => newSelected.delete(date));
    } else {
      monthDates.forEach(date => newSelected.add(date));
    }
    onChange(newSelected);
  };

  const isMonthFullySelected = (monthDates: string[]) => {
    return monthDates.length > 0 && monthDates.every(date => selectedDates.has(date));
  };

  const isMonthPartiallySelected = (monthDates: string[]) => {
    return monthDates.some(date => selectedDates.has(date)) && !isMonthFullySelected(monthDates);
  };

  // Filter months and dates based on search query
  const filteredMonthGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return monthGroups;
    }

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, string[]> = {};

    Object.entries(monthGroups).forEach(([monthName, dates]) => {
      const matchingDates = dates.filter((dateStr) => {
        const formatted = formatDate(dateStr);
        return formatted.toLowerCase().includes(query) || monthName.toLowerCase().includes(query);
      });

      if (matchingDates.length > 0) {
        filtered[monthName] = matchingDates;
      }
    });

    return filtered;
  }, [monthGroups, searchQuery]);

  useEffect(() => {
    Object.entries(monthGroups).forEach(([monthName]) => {
      const checkbox = checkboxRefs.current[monthName];
      if (checkbox) {
        const monthDates = monthGroups[monthName];
        checkbox.indeterminate = isMonthPartiallySelected(monthDates);
      }
    });
  }, [selectedDates, monthGroups]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <Popover open={open} onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) setSearchQuery("");
      }}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-sm"
          >
            <span className={selectedDates.size === 0 ? "text-gray-500" : ""}>
              {selectedDates.size === 0
                ? placeholder
                : `${selectedDates.size} ${language === 'en' ? 'date(s)' : 'date(s)'} selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-3" align="start">
          <div className="mb-3">
            <input
              type="text"
              placeholder={language === 'fr' ? "Rechercher une date..." : "Search dates..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Command shouldFilter={false}>
            <CommandList>
              <CommandGroup>
                <div className="max-h-64 overflow-y-auto">
                  {Object.entries(filteredMonthGroups).length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-gray-500">
                      {language === 'fr' ? "Aucune date trouvée" : "No dates found"}
                    </div>
                  ) : (
                    Object.entries(filteredMonthGroups).map(([monthName, dates]) => (
                    <div key={monthName}>
                      <div className="w-full text-left px-3 py-2 hover:bg-blue-50 font-medium text-sm text-gray-900 flex items-center gap-2 cursor-pointer group">
                        <input
                          ref={(el) => {
                            if (el) checkboxRefs.current[monthName] = el;
                          }}
                          type="checkbox"
                          checked={isMonthFullySelected(dates)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleMonth(dates);
                          }}
                          className="w-4 h-4 cursor-pointer"
                          title={`Select/deselect all dates in ${monthName}`}
                        />
                        <button
                          onClick={() => setExpandedMonth(expandedMonth === monthName ? null : monthName)}
                          className="flex-1 text-left flex items-center gap-2"
                        >
                          <span>{expandedMonth === monthName ? "▼" : "▶"}</span>
                          {monthName}
                        </button>
                      </div>
                      {expandedMonth === monthName && (
                        <div className="bg-gray-50 pl-6">
                          {dates.map((dateStr) => (
                            <div
                              key={dateStr}
                              onClick={() => handleToggleDate(dateStr)}
                              className="px-3 py-2 cursor-pointer hover:bg-blue-100 text-sm text-gray-700 flex items-center gap-2"
                            >
                              <input
                                type="checkbox"
                                checked={selectedDates.has(dateStr)}
                                onChange={() => {}}
                                className="w-4 h-4 cursor-pointer"
                              />
                              {formatDate(dateStr)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    ))
                  )}
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function FilterCombobox({ label, placeholder, options, value, onChange }: FilterComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    return options.filter(option =>
      option.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-sm"
          >
            <span className={!value ? "text-gray-500" : ""}>
              {value ? (label.toLowerCase().includes("date") ? formatDate(value) : value) : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={`Search ${label.toLowerCase()}...`}
              value={search}
              onValueChange={setSearch}
            />
            <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
            <CommandList>
              <CommandGroup>
                <CommandItem
                  value=""
                  onSelect={() => {
                    onChange("");
                    setOpen(false);
                    setSearch("");
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === "" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {placeholder}
                </CommandItem>
                {search && (
                  <CommandItem
                    value={search}
                    onSelect={() => {
                      onChange(search);
                      setOpen(false);
                      setSearch("");
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === search ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {label.toLowerCase().includes("date") ? formatDate(search) : search}
                  </CommandItem>
                )}
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => {
                      onChange(option === value ? "" : option);
                      setOpen(false);
                      setSearch("");
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {label.toLowerCase().includes("date") ? formatDate(option) : option}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function DataTable({
  scriptUrl,
  sheetName,
  isRTL = false,
}: DataTableProps) {
  const { data, loading, error, updating, updateCell, refetch } = useSheetData({
    scriptUrl,
  });

  const { language } = useLanguage();
  const { toast } = useToast();
  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [originalValue, setOriginalValue] = useState("");
  const [editValue, setEditValue] = useState("");
  const [cellErrors, setCellErrors] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // Bulk editing states
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [bulkEditMode, setBulkEditMode] = useState<{
    colIdx: number;
    value: string;
  } | null>(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Telegram notification state
  const [selectedCompletionDate, setSelectedCompletionDate] = useState("");
  const [sendingNotification, setSendingNotification] = useState(false);
  const [showCompletionDatePicker, setShowCompletionDatePicker] = useState(false);

  // Statistics modal state
  const [showStatistics, setShowStatistics] = useState(false);

  // Filter states
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [equipeFilter, setEquipeFilter] = useState("");
  const [motifFilter, setMotifFilter] = useState("");
  const [nameSearch, setNameSearch] = useState("");

  // Hardcoded Finca filter - only show Finca 20 (case-insensitive)
  const isFinca20 = (value: string) => value.toUpperCase() === "FINCA 20";

  // Find column indices for Date, Equipe, and Motif d'absence
  const dateColIdx = useMemo(() => {
    return data?.headers?.findIndex(h => String(h).toLowerCase().includes("date")) ?? 1;
  }, [data?.headers]);

  const equipeColIdx = useMemo(() => {
    return data?.headers?.findIndex(h => String(h).toLowerCase().includes("equipe")) ?? 4;
  }, [data?.headers]);

  const motifColIdx = useMemo(() => {
    return data?.headers?.findIndex(h => String(h).toLowerCase().includes("motif")) ?? 5;
  }, [data?.headers]);

  // Find column indices for read-only fields
  const fincaColIdx = useMemo(() => {
    return data?.headers?.findIndex(h => String(h).toLowerCase().includes("finca")) ?? 0;
  }, [data?.headers]);

  const nomPrenomColIdx = useMemo(() => {
    return data?.headers?.findIndex(h => String(h).toLowerCase().includes("nom et prénom") || String(h).toLowerCase().includes("nom et prenom")) ?? 3;
  }, [data?.headers]);

  const codeColIdx = useMemo(() => {
    return data?.headers?.findIndex(h => String(h).toLowerCase().includes("code")) ?? 2;
  }, [data?.headers]);

  // Define read-only columns
  const readOnlyColIndices = useMemo(() => {
    return new Set([fincaColIdx, dateColIdx, nomPrenomColIdx, codeColIdx, equipeColIdx]);
  }, [fincaColIdx, dateColIdx, nomPrenomColIdx, codeColIdx, equipeColIdx]);

  // Check if a column is editable
  const isEditableColumn = (colIdx: number) => {
    return !readOnlyColIndices.has(colIdx);
  };

  // Get unique values for filter dropdowns (only from Finca 20 data, case-insensitive)
  const uniqueDates = useMemo(() => {
    if (!data?.rows) return [];
    const dates = new Set<string>();
    data.rows.forEach(row => {
      if (isFinca20(String(row[fincaColIdx]))) {
        const cellValue = row[dateColIdx];
        if (cellValue) dates.add(String(cellValue));
      }
    });
    return Array.from(dates).sort();
  }, [data?.rows, dateColIdx, fincaColIdx, isFinca20]);

  const uniqueEquipes = useMemo(() => {
    if (!data?.rows) return [];
    const equipes = new Set<string>();
    data.rows.forEach(row => {
      if (isFinca20(String(row[fincaColIdx]))) {
        const cellValue = row[equipeColIdx];
        if (cellValue) equipes.add(String(cellValue));
      }
    });
    return Array.from(equipes).sort();
  }, [data?.rows, equipeColIdx, fincaColIdx, isFinca20]);

  const uniqueMotifs = useMemo(() => {
    if (!data?.rows) return [];
    const motifs = new Set<string>();
    data.rows.forEach(row => {
      if (isFinca20(String(row[fincaColIdx]))) {
        const cellValue = row[motifColIdx];
        if (cellValue) motifs.add(String(cellValue));
      }
    });
    return Array.from(motifs).sort();
  }, [data?.rows, motifColIdx, fincaColIdx, isFinca20]);

  // Filter rows based on filter values, tracking original indices
  const filteredRows = useMemo(() => {
    if (!data?.rows) return [];
    const result: FilteredRow[] = [];
    data.rows.forEach((row, originalIndex) => {
      // Hardcoded Finca 20 filter - always applied (case-insensitive)
      const fincaMatch = isFinca20(String(row[fincaColIdx]));
      const dateMatch = selectedDates.size === 0 || selectedDates.has(String(row[dateColIdx]));
      const equipeMatch = !equipeFilter || String(row[equipeColIdx]) === equipeFilter;
      const motifMatch = !motifFilter || String(row[motifColIdx]) === motifFilter;
      const nameMatch = !nameSearch || String(row[nomPrenomColIdx]).toLowerCase().includes(nameSearch.toLowerCase());
      if (fincaMatch && dateMatch && equipeMatch && motifMatch && nameMatch) {
        result.push({ row, originalIndex });
      }
    });
    return result;
  }, [data?.rows, selectedDates, equipeFilter, motifFilter, nameSearch, dateColIdx, equipeColIdx, motifColIdx, nomPrenomColIdx, fincaColIdx, isFinca20]);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const handleCellClick = (originalRowIdx: number, colIdx: number) => {
    if (!data?.rows[originalRowIdx]) return;
    if (!isEditableColumn(colIdx)) return;

    const cellValue = data.rows[originalRowIdx][colIdx];
    const stringValue = String(cellValue ?? "");
    setEditingCell({ row: originalRowIdx, col: colIdx });
    setOriginalValue(stringValue);
    setEditValue(stringValue);
    setCellErrors({});
  };

  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleCellKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      showConfirmation();
    } else if (e.key === "Escape") {
      setEditingCell(null);
      setCellErrors({});
    }
  };

  const showConfirmation = () => {
    if (!editingCell || editValue === originalValue) {
      // No change, just cancel editing
      setEditingCell(null);
      setCellErrors({});
      return;
    }

    toast({
      title: "Confirm Change",
      description: `Update from "${originalValue}" to "${editValue}"?`,
      action: (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              saveCellEdit();
              toast.dismiss?.();
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            Confirm
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingCell(null);
              setCellErrors({});
              toast.dismiss?.();
            }}
          >
            Cancel
          </Button>
        </div>
      ),
    });
  };

  const saveCellEdit = async () => {
    if (!editingCell) return;

    const cellKey = `${editingCell.row}-${editingCell.col}`;

    try {
      const success = await updateCell(
        editingCell.row,
        editingCell.col,
        editValue
      );

      if (success) {
        setEditingCell(null);
        setCellErrors({});
        toast({
          title: "Success",
          description: "Cell updated successfully",
        });
      } else {
        setCellErrors((prev) => ({
          ...prev,
          [cellKey]: "Failed to update cell",
        }));
      }
    } catch (err) {
      setCellErrors((prev) => ({
        ...prev,
        [cellKey]: err instanceof Error ? err.message : "Unknown error",
      }));
    }
  };

  const handleCellBlur = () => {
    if (editValue !== originalValue) {
      showConfirmation();
    } else {
      setEditingCell(null);
      setCellErrors({});
    }
  };

  const toggleRowSelection = (originalRowIdx: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(originalRowIdx)) {
      newSelected.delete(originalRowIdx);
    } else {
      newSelected.add(originalRowIdx);
    }
    setSelectedRows(newSelected);
  };

  const selectAllRows = () => {
    const allIndices = new Set(filteredRows.map(f => f.originalIndex));
    setSelectedRows(allIndices);
  };

  const clearAllRows = () => {
    setSelectedRows(new Set());
    setBulkEditMode(null);
  };

  const startBulkEdit = (colIdx: number) => {
    if (selectedRows.size === 0) return;
    setBulkEditMode({ colIdx, value: "" });
  };

  const saveBulkEdit = async () => {
    if (!bulkEditMode || selectedRows.size === 0) return;

    setBulkUpdating(true);
    let successCount = 0;
    let failureCount = 0;

    try {
      for (const rowIdx of selectedRows) {
        try {
          const success = await updateCell(rowIdx, bulkEditMode.colIdx, bulkEditMode.value);
          if (success) {
            successCount++;
          } else {
            failureCount++;
          }
        } catch (err) {
          failureCount++;
          console.error("Error updating row:", err);
        }
      }

      if (successCount > 0) {
        toast({
          title: "Bulk Update Complete",
          description: `Updated ${successCount} row${successCount !== 1 ? 's' : ''}${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
        });
      }

      setBulkEditMode(null);
      setSelectedRows(new Set());
    } finally {
      setBulkUpdating(false);
    }
  };

  const cancelBulkEdit = () => {
    setBulkEditMode(null);
  };

  const sendTelegramNotification = async () => {
    if (!selectedCompletionDate) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    setSendingNotification(true);
    try {
      const response = await fetch(`/api/telegram-notify?date=${encodeURIComponent(selectedCompletionDate)}&language=${language}`);
      const result = await response.json();

      if (result.success) {
        toast({
          title: t("Success", language),
          description: t("Notification sent for", language) + ` ${selectedCompletionDate}`,
        });
        setShowCompletionDatePicker(false);
        setSelectedCompletionDate("");
      } else {
        toast({
          title: t("Error", language),
          description: result.error || t("Failed to send notification", language),
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: t("Error", language),
        description: err instanceof Error ? err.message : t("Failed to send notification", language),
        variant: "destructive",
      });
    } finally {
      setSendingNotification(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin text-blue-600" size={40} />
          <p className="text-gray-600">Loading sheet data...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{sheetName}</h1>
            </div>
          </div>

          <Button
            onClick={refetch}
            variant="outline"
            className="gap-2"
            disabled={loading}
          >
            <RefreshCw size={16} />
            {t("Refresh", language)}
          </Button>

          {/* Statistics Button */}
          <Button
            onClick={() => setShowStatistics(true)}
            variant="outline"
            className="gap-2"
          >
            <BarChart3 size={16} />
            {t("Statistics", language)}
          </Button>

          {/* Completion Date Picker */}
          <Popover open={showCompletionDatePicker} onOpenChange={setShowCompletionDatePicker}>
            <PopoverTrigger asChild>
              <Button
              variant="default"
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Calendar size={16} />
              {selectedCompletionDate ? `${t("Notification sent for", language)}: ${selectedCompletionDate}` : t("Mark Complete", language)}
            </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    {language === 'en' ? 'Select Completion Date' : 'Sélectionner la date d\'achèvement'}
                  </label>
                  <input
                    type="date"
                    value={selectedCompletionDate}
                    onChange={(e) => setSelectedCompletionDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={sendTelegramNotification}
                    disabled={!selectedCompletionDate || sendingNotification}
                    className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                  >
                    {sendingNotification ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        {language === 'en' ? 'Sending...' : 'Envoi...'}
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        {t("Send to Telegram", language)}
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCompletionDatePicker(false);
                      setSelectedCompletionDate("");
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    {t("Cancel", language)}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Filter Controls */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Filters</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Name Search */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-600">Name</label>
              <input
                type="text"
                placeholder="Search by name..."
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date Filter */}
            <DateFilterCombobox
              label="Date"
              placeholder="All dates"
              options={uniqueDates}
              selectedDates={selectedDates}
              onChange={setSelectedDates}
              language={language}
            />

            {/* Equipe Filter */}
            <FilterCombobox
              label="Equipe"
              placeholder="All equipes"
              options={uniqueEquipes}
              value={equipeFilter}
              onChange={setEquipeFilter}
            />

            {/* Motif Filter */}
            <FilterCombobox
              label="Motif d'absence"
              placeholder="All motifs"
              options={uniqueMotifs}
              value={motifFilter}
              onChange={setMotifFilter}
            />
          </div>

          {/* Clear Filters Button */}
          {(selectedDates.size > 0 || equipeFilter || motifFilter || nameSearch) && (
            <div className="mt-3 flex justify-end">
              <Button
                onClick={() => {
                  setSelectedDates(new Set());
                  setEquipeFilter("");
                  setMotifFilter("");
                  setNameSearch("");
                }}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <X size={14} />
                Clear Filters
              </Button>
              <p className="text-xs text-gray-500 ml-3 my-auto">
                (Note: Finca 20 filter is always applied)
              </p>
            </div>
          )}
        </div>

        {/* Bulk Edit Panel */}
        {selectedRows.size > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">{selectedRows.size} {t("rows selected", language)}</h3>
                {bulkEditMode ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <label className="text-sm font-medium text-blue-900">
                      {data?.headers?.[bulkEditMode.colIdx] || `Column ${bulkEditMode.colIdx + 1}`}:
                    </label>
                    <input
                      type="text"
                      value={bulkEditMode.value}
                      onChange={(e) => setBulkEditMode({ ...bulkEditMode, value: e.target.value })}
                      placeholder={language === 'en' ? "Enter value to apply to all selected rows" : "Entrez la valeur à appliquer à toutes les lignes sélectionnées"}
                      className="flex-1 bg-white border border-blue-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={bulkUpdating}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-blue-700">{t("Select a column to edit", language)}</p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {bulkEditMode ? (
                  <>
                    <Button
                      onClick={saveBulkEdit}
                      disabled={bulkUpdating || !bulkEditMode.value}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {bulkUpdating ? "Updating..." : "Confirm"}
                    </Button>
                    <Button
                      onClick={cancelBulkEdit}
                      disabled={bulkUpdating}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={selectAllRows}
                      variant="outline"
                      size="sm"
                    >
                      {t("Select All", language)}
                    </Button>
                    <Button
                      onClick={clearAllRows}
                      variant="outline"
                      size="sm"
                    >
                      {t("Clear", language)}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-medium text-red-900">Error Loading Data</h3>
              <p className="text-sm text-red-700">{error}</p>
              <p className="text-xs text-red-600 mt-2">Check the browser console (F12) for more details.</p>
            </div>
          </div>
        )}

        {data && Array.isArray(data.rows) && data.rows.length > 0 && filteredRows.length > 0 ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-100 w-12 text-center sticky left-0 z-10">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-100 w-12 text-center sticky left-12 z-10">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === filteredRows.length && filteredRows.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            selectAllRows();
                          } else {
                            clearAllRows();
                          }
                        }}
                        className="w-4 h-4 cursor-pointer"
                        title="Select/deselect all visible rows"
                      />
                    </th>
                    {data.headers && Array.isArray(data.headers) && data.headers.length > 0
                      ? data.headers.map((header, colIdx) => {
                          // Hide columns I (8) and J (9) from display
                          if (colIdx === 8 || colIdx === 9) return null;
                          const headerStr = String(header ?? `Col ${colIdx + 1}`);
                          const isSelectableForBulkEdit = !readOnlyColIndices.has(colIdx);
                          return (
                            <th
                              key={colIdx}
                              className={cn(
                                "px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-100 whitespace-nowrap",
                                selectedRows.size > 0 && isSelectableForBulkEdit && "cursor-pointer hover:bg-blue-100"
                              )}
                              onClick={() => {
                                if (selectedRows.size > 0 && isSelectableForBulkEdit && !bulkEditMode) {
                                  startBulkEdit(colIdx);
                                }
                              }}
                              title={selectedRows.size > 0 && isSelectableForBulkEdit ? "Click to bulk edit this column" : ""}
                            >
                              {headerStr}
                              {bulkEditMode?.colIdx === colIdx && (
                                <span className="ml-2 inline-block bg-blue-500 text-white text-xs px-2 py-1 rounded">Edit</span>
                              )}
                            </th>
                          );
                        })
                      : data.rows[0]
                      ? data.rows[0].map((_, colIdx) => {
                          // Hide columns I (8) and J (9) from display
                          if (colIdx === 8 || colIdx === 9) return null;
                          return (
                            <th
                              key={colIdx}
                              className="px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-100 whitespace-nowrap"
                            >
                              Column {colIdx + 1}
                            </th>
                          );
                        })
                      : null}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((filteredRow, displayRowIdx) => (
                    <tr
                      key={filteredRow.originalIndex}
                      className={cn(
                        "border-b border-gray-200 transition-colors",
                        selectedRows.has(filteredRow.originalIndex) ? "bg-blue-100" : "hover:bg-blue-50"
                      )}
                    >
                      <td className="px-4 py-3 text-sm text-gray-500 bg-gray-50 font-medium text-center sticky left-0 z-10">
                        {displayRowIdx + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 bg-gray-50 font-medium text-center sticky left-12 z-10">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(filteredRow.originalIndex)}
                          onChange={() => toggleRowSelection(filteredRow.originalIndex)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                      {filteredRow.row.map((cell, colIdx) => {
                        // Hide columns I (8) and J (9) from display
                        if (colIdx === 8 || colIdx === 9) return null;

                        const isEditing =
                          editingCell?.row === filteredRow.originalIndex &&
                          editingCell?.col === colIdx;
                        const cellKey = `${filteredRow.originalIndex}-${colIdx}`;
                        const hasCellError = cellKey in cellErrors;
                        const isReadOnly = !isEditableColumn(colIdx);

                        return (
                          <td
                            key={colIdx}
                            className={cn(
                              "px-4 py-3 text-sm border-r border-gray-100 transition-all",
                              isReadOnly && "bg-gray-50 text-gray-600 cursor-not-allowed",
                              !isReadOnly && "cursor-text",
                              isEditing && "bg-blue-100 outline outline-2 outline-blue-500",
                              hasCellError && "bg-red-50",
                              !isEditing && !isReadOnly && "bg-white hover:bg-blue-50"
                            )}
                            onClick={() => !isReadOnly && handleCellClick(filteredRow.originalIndex, colIdx)}
                          >
                            {isEditing ? (
                              <input
                                ref={inputRef}
                                type="text"
                                value={editValue}
                                onChange={handleCellChange}
                                onKeyDown={handleCellKeyDown}
                                onBlur={handleCellBlur}
                                disabled={updating}
                                className={cn(
                                  "w-full bg-white text-gray-900 border border-blue-400 rounded px-2 py-1 focus:outline-none",
                                  updating && "opacity-60"
                                )}
                              />
                            ) : (
                              <span
                                className={cn(
                                  "block",
                                  !cell && "text-gray-400"
                                )}
                              >
                                {cell !== null && cell !== undefined && cell !== ""
                                  ? formatCellValue(cell, data.headers?.[colIdx] as string)
                                  : "—"}
                              </span>
                            )}
                            {hasCellError && (
                              <p className="text-xs text-red-600 mt-1">
                                {cellErrors[cellKey]}
                              </p>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-gray-600">
              <div>
                Showing <strong>{filteredRows?.length || 0}</strong> rows{" "}
                {(selectedDates.size > 0 || equipeFilter || motifFilter) && (
                  <span>of <strong>{data.rows?.length || 0}</strong></span>
                )}{" "}
                ×{" "}
                <strong>{Array.isArray(data.rows) && data.rows.length > 0 ? data.rows[0]?.length || 0 : 0}</strong> columns
              </div>
              {updating && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Loader size={14} className="animate-spin" />
                  Saving changes...
                </div>
              )}
            </div>
          </div>
        ) : data && Array.isArray(data.rows) && data.rows.length > 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-500 mb-4">No rows match the current filters</p>
            <Button
              onClick={() => {
                setSelectedDates(new Set());
                setEquipeFilter("");
                setMotifFilter("");
              }}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <X size={14} />
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-500">No data found in the sheet</p>
          </div>
        )}

        {/* Statistics Modal */}
        <StatisticsModal
          isOpen={showStatistics}
          onClose={() => setShowStatistics(false)}
          data={data}
          motifColIdx={motifColIdx}
          dateColIdx={dateColIdx}
          equipeColIdx={equipeColIdx}
          language={language}
          selectedDates={selectedDates}
        />
      </div>
    </div>
  );
}
