// Configuration
const CONFIG = {
    GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxQVdsR_OFit9nEEzm4ksImuMLxMOk2cl1aVo27Ab4PuoTVaCiJn5UKNiw0DtP1BVB3VQ/exec',
    SHEET_NAME: 'ABSENCES',
    READ_ONLY_COLS: ['finca', 'date', 'code', 'nom et prénom', 'equipe'],
    HIDDEN_COLS: [8, 9]
};

// Translations
const TRANSLATIONS = {
    en: {
        refresh: 'Refresh',
        statistics: 'Statistics',
        markComplete: 'Mark Complete',
        filters: 'Filters',
        name: 'Name',
        date: 'Date',
        equipe: 'Equipe',
        motif: 'Motif d\'absence',
        allDates: 'All dates',
        allEquipes: 'All equipes',
        allMotifs: 'All motifs',
        clearFilters: 'Clear Filters',
        selectAll: 'Select All',
        clear: 'Clear',
        rows: 'rows selected',
        showingRows: 'Showing',
        rowsOf: 'of',
        columns: 'columns',
        selectCompletionDate: 'Select Completion Date',
        sendTelegram: 'Send to Telegram',
        cancel: 'Cancel',
        success: 'Success',
        error: 'Error',
        errorLoadingData: 'Error Loading Data',
        noData: 'No data found in the sheet',
        noResults: 'No rows match the current filters',
        savingChanges: 'Saving changes...',
        cellUpdated: 'Cell updated successfully',
        bulkUpdateComplete: 'Bulk Update Complete',
        updatedRows: 'Updated',
        failed: 'failed',
        notificationSent: 'Notification sent for',
        failedSendNotification: 'Failed to send notification',
        selectDate: 'Please select a date'
    },
    fr: {
        refresh: 'Actualiser',
        statistics: 'Statistiques',
        markComplete: 'Marquer comme terminé',
        filters: 'Filtres',
        name: 'Nom',
        date: 'Date',
        equipe: 'Équipe',
        motif: 'Motif d\'absence',
        allDates: 'Toutes les dates',
        allEquipes: 'Toutes les équipes',
        allMotifs: 'Tous les motifs',
        clearFilters: 'Effacer les filtres',
        selectAll: 'Sélectionner tout',
        clear: 'Effacer',
        rows: 'lignes sélectionnées',
        showingRows: 'Affichage',
        rowsOf: 'de',
        columns: 'colonnes',
        selectCompletionDate: 'Sélectionner la date d\'achèvement',
        sendTelegram: 'Envoyer à Telegram',
        cancel: 'Annuler',
        success: 'Succès',
        error: 'Erreur',
        errorLoadingData: 'Erreur lors du chargement des données',
        noData: 'Aucune donnée trouvée dans la feuille',
        noResults: 'Aucune ligne ne correspond aux filtres actuels',
        savingChanges: 'Sauvegarde des modifications...',
        cellUpdated: 'Cellule mise à jour avec succès',
        bulkUpdateComplete: 'Mise à jour en bloc terminée',
        updatedRows: 'Mis à jour',
        failed: 'échoué',
        notificationSent: 'Notification envoyée pour',
        failedSendNotification: 'Erreur lors de l\'envoi de la notification',
        selectDate: 'Veuillez sélectionner une date'
    }
};

// Application State
const app = {
    data: null,
    filteredRows: [],
    selectedRows: new Set(),
    bulkEditMode: null,
    language: 'en',
    filters: {
        name: '',
        dates: new Set(),
        equipe: '',
        motif: ''
    },
    columnIndices: {},
    editingCell: null,
    loading: true,
    error: null,
    updating: false,
    
    init() {
        this.setupEventListeners();
        this.loadSystemLanguage();
        this.updateUI();
        this.fetchData();
    },
    
    setupEventListeners() {
        // Filter events
        document.getElementById('name-filter').addEventListener('input', (e) => {
            this.filters.name = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('date-filter-btn').addEventListener('click', () => {
            this.toggleDropdown('date-filter-dropdown');
        });
        
        document.getElementById('equipe-filter-btn').addEventListener('click', () => {
            this.toggleDropdown('equipe-filter-dropdown');
        });
        
        document.getElementById('motif-filter-btn').addEventListener('click', () => {
            this.toggleDropdown('motif-filter-dropdown');
        });
        
        // Refresh button
        document.getElementById('refresh-btn').addEventListener('click', () => this.fetchData());
        
        // Statistics button
        document.getElementById('stats-btn').addEventListener('click', () => this.showStatistics());
        document.getElementById('stats-close-btn').addEventListener('click', () => this.closeModal('stats-modal'));
        
        // Notification button
        document.getElementById('notify-btn').addEventListener('click', () => this.openNotifyModal());
        document.getElementById('notify-confirm-btn').addEventListener('click', () => this.sendNotification());
        document.getElementById('notify-cancel-btn').addEventListener('click', () => this.closeModal('notify-modal'));
        
        // Language button
        document.getElementById('lang-btn').addEventListener('click', () => this.toggleLanguage());
        
        // Clear filters
        document.getElementById('clear-filters-btn').addEventListener('click', () => this.clearAllFilters());
        document.getElementById('no-results-clear-btn').addEventListener('click', () => this.clearAllFilters());
        
        // Bulk actions
        document.getElementById('bulk-select-all-btn').addEventListener('click', () => this.selectAllRows());
        document.getElementById('bulk-clear-btn').addEventListener('click', () => this.clearSelectedRows());
        
        // Close modals on background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });
        
        // Close dropdowns on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.filter-group')) {
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.classList.add('hidden');
                });
            }
        });
    },
    
    async fetchData() {
        this.loading = true;
        this.error = null;
        this.updateUI();
        
        try {
            const url = new URL(CONFIG.GOOGLE_APPS_SCRIPT_URL);
            url.searchParams.append('action', 'getData');
            
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'API returned success: false');
            }
            
            let sheetData = result.data || result;
            
            if (!sheetData.headers || !sheetData.rows) {
                throw new Error('Invalid data format');
            }
            
            let rows = sheetData.rows;
            if (!Array.isArray(rows)) {
                rows = Object.values(rows);
            }
            
            this.data = {
                headers: sheetData.headers,
                rows: rows
            };
            
            this.findColumnIndices();
            this.applyFilters();
            this.renderTable();
            this.loading = false;
        } catch (err) {
            this.error = err.message;
            console.error('Error fetching data:', err);
        }
        
        this.updateUI();
    },
    
    findColumnIndices() {
        if (!this.data?.headers) return;
        
        this.columnIndices = {
            finca: this.data.headers.findIndex(h => String(h).toLowerCase().includes('finca')) || 0,
            date: this.data.headers.findIndex(h => String(h).toLowerCase().includes('date')) || 1,
            code: this.data.headers.findIndex(h => String(h).toLowerCase().includes('code')) || 2,
            nomPrenom: this.data.headers.findIndex(h => 
                String(h).toLowerCase().includes('nom') && String(h).toLowerCase().includes('prénom')) || 3,
            equipe: this.data.headers.findIndex(h => String(h).toLowerCase().includes('equipe')) || 4,
            motif: this.data.headers.findIndex(h => String(h).toLowerCase().includes('motif')) || 5
        };
    },
    
    isReadOnly(colIdx) {
        const header = this.data.headers[colIdx];
        if (!header) return true;
        const headerLower = String(header).toLowerCase();
        return CONFIG.READ_ONLY_COLS.some(col => headerLower.includes(col));
    },
    
    applyFilters() {
        if (!this.data?.rows) {
            this.filteredRows = [];
            return;
        }
        
        this.filteredRows = this.data.rows
            .map((row, idx) => ({ row, idx }))
            .filter(({ row }) => {
                const name = String(row[this.columnIndices.nomPrenom] || '').toLowerCase();
                const date = String(row[this.columnIndices.date] || '');
                const equipe = String(row[this.columnIndices.equipe] || '');
                const motif = String(row[this.columnIndices.motif] || '');
                
                const nameMatch = !this.filters.name || name.includes(this.filters.name.toLowerCase());
                const dateMatch = this.filters.dates.size === 0 || this.filters.dates.has(date);
                const equipeMatch = !this.filters.equipe || equipe === this.filters.equipe;
                const motifMatch = !this.filters.motif || motif === this.filters.motif;
                
                return nameMatch && dateMatch && equipeMatch && motifMatch;
            });
    },
    
    renderTable() {
        if (!this.data?.headers) return;
        
        const thead = document.querySelector('#table-head tr');
        const tbody = document.getElementById('table-body');
        
        thead.innerHTML = '';
        tbody.innerHTML = '';
        
        // Render headers
        const indexHeader = document.createElement('th');
        indexHeader.textContent = '#';
        indexHeader.style.width = '50px';
        indexHeader.style.textAlign = 'center';
        thead.appendChild(indexHeader);
        
        const checkHeader = document.createElement('th');
        checkHeader.style.width = '50px';
        checkHeader.style.textAlign = 'center';
        const checkInput = document.createElement('input');
        checkInput.type = 'checkbox';
        checkInput.addEventListener('change', (e) => {
            if (e.target.checked) this.selectAllRows();
            else this.clearSelectedRows();
        });
        checkHeader.appendChild(checkInput);
        thead.appendChild(checkHeader);
        
        this.data.headers.forEach((header, idx) => {
            if (CONFIG.HIDDEN_COLS.includes(idx)) return;
            const th = document.createElement('th');
            th.textContent = header;
            thead.appendChild(th);
        });
        
        // Render rows
        this.filteredRows.forEach(({ row, idx }, displayIdx) => {
            const tr = document.createElement('tr');
            if (this.selectedRows.has(idx)) tr.classList.add('selected');
            
            // Row number
            const numTd = document.createElement('td');
            numTd.textContent = displayIdx + 1;
            numTd.style.textAlign = 'center';
            tr.appendChild(numTd);
            
            // Checkbox
            const checkTd = document.createElement('td');
            checkTd.style.textAlign = 'center';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = this.selectedRows.has(idx);
            checkbox.addEventListener('change', () => this.toggleRowSelection(idx));
            checkTd.appendChild(checkbox);
            tr.appendChild(checkTd);
            
            // Data cells
            row.forEach((cell, colIdx) => {
                if (CONFIG.HIDDEN_COLS.includes(colIdx)) return;
                
                const td = document.createElement('td');
                const isReadOnly = this.isReadOnly(colIdx);
                const isEditing = this.editingCell?.row === idx && this.editingCell?.col === colIdx;
                
                if (isReadOnly) {
                    td.classList.add('cell-readonly');
                }
                
                if (isEditing) {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = String(cell || '');
                    input.addEventListener('blur', () => this.saveCellEdit(idx, colIdx, input.value));
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') this.saveCellEdit(idx, colIdx, input.value);
                        if (e.key === 'Escape') this.cancelCellEdit();
                    });
                    td.appendChild(input);
                    setTimeout(() => input.focus(), 0);
                } else {
                    td.textContent = cell || '—';
                    if (!isReadOnly) {
                        td.style.cursor = 'text';
                        td.addEventListener('click', () => this.startCellEdit(idx, colIdx));
                    }
                }
                
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        });
    },
    
    startCellEdit(rowIdx, colIdx) {
        if (this.isReadOnly(colIdx)) return;
        this.editingCell = { row: rowIdx, col: colIdx };
        this.renderTable();
    },
    
    cancelCellEdit() {
        this.editingCell = null;
        this.renderTable();
    },
    
    async saveCellEdit(rowIdx, colIdx, value) {
        if (value === String(this.data.rows[rowIdx][colIdx])) {
            this.cancelCellEdit();
            return;
        }
        
        this.updating = true;
        this.updateUI();
        
        try {
            const url = new URL(CONFIG.GOOGLE_APPS_SCRIPT_URL);
            url.searchParams.append('action', 'updateCell');
            url.searchParams.append('row', String(rowIdx));
            url.searchParams.append('col', String(colIdx));
            url.searchParams.append('value', String(value));
            
            const response = await fetch(url.toString());
            const result = await response.json();
            
            if (result.success) {
                this.data.rows[rowIdx][colIdx] = value;
                this.applyFilters();
                this.renderTable();
                this.showToast(TRANSLATIONS[this.language].success, TRANSLATIONS[this.language].cellUpdated, 'success');
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            this.showToast(TRANSLATIONS[this.language].error, err.message, 'error');
        }
        
        this.updating = false;
        this.updateUI();
        this.editingCell = null;
    },
    
    toggleRowSelection(rowIdx) {
        if (this.selectedRows.has(rowIdx)) {
            this.selectedRows.delete(rowIdx);
        } else {
            this.selectedRows.add(rowIdx);
        }
        this.renderTable();
        this.updateUI();
    },
    
    selectAllRows() {
        this.filteredRows.forEach(({ idx }) => {
            this.selectedRows.add(idx);
        });
        this.renderTable();
        this.updateUI();
    },
    
    clearSelectedRows() {
        this.selectedRows.clear();
        this.bulkEditMode = null;
        this.renderTable();
        this.updateUI();
    },
    
    toggleDropdown(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        dropdown.classList.toggle('hidden');
        
        if (dropdownId === 'date-filter-dropdown' && dropdown.classList.length === 1) {
            this.renderDateOptions();
        } else if (dropdownId === 'equipe-filter-dropdown' && dropdown.classList.length === 1) {
            this.renderEquipeOptions();
        } else if (dropdownId === 'motif-filter-dropdown' && dropdown.classList.length === 1) {
            this.renderMotifOptions();
        }
    },
    
    renderDateOptions() {
        const dates = new Set();
        this.data?.rows?.forEach(row => {
            const date = row[this.columnIndices.date];
            if (date) dates.add(String(date));
        });
        
        const container = document.getElementById('date-options');
        container.innerHTML = '';
        
        Array.from(dates).sort().forEach(date => {
            const div = document.createElement('div');
            div.className = 'option-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = this.filters.dates.has(date);
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    this.filters.dates.add(date);
                } else {
                    this.filters.dates.delete(date);
                }
                this.applyFilters();
                this.renderTable();
                this.updateUI();
            });
            
            div.appendChild(checkbox);
            div.appendChild(document.createTextNode(date));
            container.appendChild(div);
        });
    },
    
    renderEquipeOptions() {
        const equipes = new Set();
        this.data?.rows?.forEach(row => {
            const equipe = row[this.columnIndices.equipe];
            if (equipe) equipes.add(String(equipe));
        });
        
        const container = document.getElementById('equipe-options');
        container.innerHTML = '';
        
        Array.from(equipes).sort().forEach(equipe => {
            const div = document.createElement('div');
            div.className = 'option-item';
            
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'equipe-filter';
            input.checked = this.filters.equipe === equipe;
            input.addEventListener('change', () => {
                this.filters.equipe = equipe;
                this.applyFilters();
                this.renderTable();
                this.updateUI();
                this.toggleDropdown('equipe-filter-dropdown');
            });
            
            div.appendChild(input);
            div.appendChild(document.createTextNode(equipe));
            container.appendChild(div);
        });
    },
    
    renderMotifOptions() {
        const motifs = new Set();
        this.data?.rows?.forEach(row => {
            const motif = row[this.columnIndices.motif];
            if (motif) motifs.add(String(motif));
        });
        
        const container = document.getElementById('motif-options');
        container.innerHTML = '';
        
        Array.from(motifs).sort().forEach(motif => {
            const div = document.createElement('div');
            div.className = 'option-item';
            
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'motif-filter';
            input.checked = this.filters.motif === motif;
            input.addEventListener('change', () => {
                this.filters.motif = motif;
                this.applyFilters();
                this.renderTable();
                this.updateUI();
                this.toggleDropdown('motif-filter-dropdown');
            });
            
            div.appendChild(input);
            div.appendChild(document.createTextNode(motif));
            container.appendChild(div);
        });
    },
    
    clearAllFilters() {
        this.filters = {
            name: '',
            dates: new Set(),
            equipe: '',
            motif: ''
        };
        document.getElementById('name-filter').value = '';
        this.applyFilters();
        this.renderTable();
        this.updateUI();
    },
    
    openNotifyModal() {
        document.getElementById('notify-modal').classList.remove('hidden');
    },
    
    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    },
    
    async sendNotification() {
        const date = document.getElementById('completion-date').value;
        if (!date) {
            this.showToast(TRANSLATIONS[this.language].error, TRANSLATIONS[this.language].selectDate, 'error');
            return;
        }
        
        try {
            const response = await fetch(`/api/telegram-notify?date=${encodeURIComponent(date)}&language=${this.language}`);
            const result = await response.json();
            
            if (result.success) {
                this.showToast(TRANSLATIONS[this.language].success, `${TRANSLATIONS[this.language].notificationSent} ${date}`, 'success');
                this.closeModal('notify-modal');
                document.getElementById('completion-date').value = '';
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            this.showToast(TRANSLATIONS[this.language].error, TRANSLATIONS[this.language].failedSendNotification, 'error');
        }
    },
    
    showStatistics() {
        const modal = document.getElementById('stats-modal');
        modal.classList.remove('hidden');
        
        const motifs = {};
        const equipes = {};
        const dates = {};
        
        this.data?.rows?.forEach(row => {
            const motif = String(row[this.columnIndices.motif] || 'N/A');
            const equipe = String(row[this.columnIndices.equipe] || 'N/A');
            const date = String(row[this.columnIndices.date] || 'N/A');
            
            motifs[motif] = (motifs[motif] || 0) + 1;
            equipes[equipe] = (equipes[equipe] || 0) + 1;
            dates[date] = (dates[date] || 0) + 1;
        });
        
        let html = '<div class="stats-section"><h3>By Motif</h3>';
        Object.entries(motifs).forEach(([motif, count]) => {
            html += `<div class="stat-item"><span>${motif}</span><strong>${count}</strong></div>`;
        });
        html += '</div>';
        
        html += '<div class="stats-section"><h3>By Equipe</h3>';
        Object.entries(equipes).forEach(([equipe, count]) => {
            html += `<div class="stat-item"><span>${equipe}</span><strong>${count}</strong></div>`;
        });
        html += '</div>';
        
        document.getElementById('stats-content').innerHTML = html;
    },
    
    toggleLanguage() {
        this.language = this.language === 'en' ? 'fr' : 'en';
        localStorage.setItem('language', this.language);
        this.updateUI();
    },
    
    loadSystemLanguage() {
        const saved = localStorage.getItem('language');
        if (saved) {
            this.language = saved;
        } else {
            this.language = navigator.language.startsWith('fr') ? 'fr' : 'en';
        }
    },
    
    showToast(title, description, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const titleEl = document.createElement('div');
        titleEl.className = 'toast-title';
        titleEl.textContent = title;
        
        const descEl = document.createElement('div');
        descEl.className = 'toast-description';
        descEl.textContent = description;
        
        toast.appendChild(titleEl);
        toast.appendChild(descEl);
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 4000);
    },
    
    updateUI() {
        const t = TRANSLATIONS[this.language];
        
        // Update labels
        document.getElementById('refresh-label').textContent = t.refresh;
        document.getElementById('stats-label').textContent = t.statistics;
        document.getElementById('notify-label').textContent = t.markComplete;
        document.getElementById('lang-btn').textContent = this.language === 'en' ? 'FR' : 'EN';
        document.getElementById('filters-title').textContent = t.filters;
        document.getElementById('name-label').textContent = t.name;
        document.getElementById('date-label').textContent = t.date;
        document.getElementById('equipe-label').textContent = t.equipe;
        document.getElementById('motif-label').textContent = t.motif;
        document.getElementById('stats-title').textContent = t.statistics;
        document.getElementById('notify-title').textContent = t.selectCompletionDate;
        document.getElementById('notify-confirm-btn').textContent = t.sendTelegram;
        document.getElementById('notify-cancel-btn').textContent = t.cancel;
        document.getElementById('bulk-select-all-btn').textContent = t.selectAll;
        document.getElementById('bulk-clear-btn').textContent = t.clear;
        document.getElementById('clear-filters-btn').textContent = t.clearFilters;
        
        // Update filter buttons
        document.getElementById('date-filter-btn').textContent = this.filters.dates.size > 0 
            ? `${this.filters.dates.size} dates` 
            : t.allDates;
        document.getElementById('equipe-filter-btn').textContent = this.filters.equipe || t.allEquipes;
        document.getElementById('motif-filter-btn').textContent = this.filters.motif || t.allMotifs;
        document.getElementById('name-filter').placeholder = `${t.name.toLowerCase()}...`;
        
        // Show/hide elements
        const hasFilters = this.filters.dates.size > 0 || this.filters.equipe || this.filters.motif || this.filters.name;
        document.getElementById('clear-filters-container').classList.toggle('hidden', !hasFilters);
        
        // Show/hide loading
        document.getElementById('loading').classList.toggle('hidden', !this.loading);
        
        // Show/hide error
        if (this.error) {
            document.getElementById('error-text').textContent = this.error;
            document.getElementById('error-container').classList.remove('hidden');
        } else {
            document.getElementById('error-container').classList.add('hidden');
        }
        
        // Show/hide table
        const hasData = this.data?.rows?.length > 0;
        document.getElementById('table-container').classList.toggle('hidden', !hasData || this.loading);
        
        // Show/hide no results
        const showNoResults = hasData && this.filteredRows.length === 0 && !this.loading;
        document.getElementById('no-results').classList.toggle('hidden', !showNoResults);
        
        // Update row count
        if (this.data?.rows?.length > 0) {
            const rowText = `${t.showingRows} ${this.filteredRows.length} ${this.filteredRows.length !== 1 ? t.rows : ''}`;
            document.getElementById('row-count').textContent = rowText;
        }
        
        // Show/hide bulk panel
        document.getElementById('bulk-panel').classList.toggle('hidden', this.selectedRows.size === 0);
        if (this.selectedRows.size > 0) {
            document.getElementById('bulk-count').textContent = `${this.selectedRows.size} ${t.rows}`;
        }
        
        // Show/hide updating status
        document.getElementById('updating-status').classList.toggle('hidden', !this.updating);
    }
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
