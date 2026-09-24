import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Modal, DeleteConfirmation, Loan, Resident, Tool } from './models';

@Injectable({ providedIn: 'root' })
export class LibraryService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiUrl = 'http://localhost:5049/api';

  readonly tools = signal<Tool[]>([]);
  readonly residents = signal<Resident[]>([]);
  readonly loans = signal<Loan[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly actionError = signal('');
  readonly search = signal('');
  readonly activeFilter = signal<'all' | 'available' | 'loaned'>('all');
  readonly modal = signal<Modal>(null);
  readonly editingId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly detailLoan = signal<Loan | null>(null);
  readonly deleteConfirmation = signal<DeleteConfirmation | null>(null);
  readonly returnDates = new Map<number, string>();

  readonly toolForm = { name: '', description: '', weight: 1, ownerId: 0 };
  readonly residentForm = { name: '', email: '', phoneNumber: '' };
  readonly loanForm = { toolId: 0, borrowerId: 0 };

  readonly filteredTools = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.tools().filter((tool) => {
      const matchesFilter = this.activeFilter() === 'all'
        || (this.activeFilter() === 'available' && tool.status === 'Available')
        || (this.activeFilter() === 'loaned' && tool.status === 'On Loan');
      const matchesSearch = !query || tool.name.toLowerCase().includes(query) || tool.description.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  });

  readonly activeLoans = computed(() => this.loans().filter((loan) => !loan.returnDate));

  constructor() {
    if (isPlatformBrowser(this.platformId)) this.loadLibrary();
    else this.loading.set(false);
  }

  ownerName(ownerId: number): string {
    return this.residents().find((resident) => resident.id === ownerId)?.name ?? 'Unknown owner';
  }

  borrowerName(borrowerId: number): string {
    return this.residents().find((resident) => resident.id === borrowerId)?.name ?? 'Unknown borrower';
  }

  toolName(toolId: number): string {
    return this.tools().find((tool) => tool.id === toolId)?.name ?? 'Unknown tool';
  }

  openAddTool(): void {
    this.editingId.set(null);
    Object.assign(this.toolForm, { name: '', description: '', weight: 1, ownerId: this.residents()[0]?.id ?? 0 });
    this.openModal('tool');
  }

  openEditTool(tool: Tool): void {
    this.http.get<Tool>(`${this.apiUrl}/tools/${tool.id}`).subscribe({
      next: (loadedTool) => { this.editingId.set(loadedTool.id); Object.assign(this.toolForm, loadedTool); this.openModal('tool'); },
      error: (response) => this.actionError.set(this.readError(response)),
    });
  }

  saveTool(): void {
    if (!this.toolForm.name.trim() || !this.toolForm.ownerId) return this.actionError.set('Add a name and choose an owner to continue.');
    this.saving.set(true);
    const payload = { ...this.toolForm, name: this.toolForm.name.trim(), description: this.toolForm.description.trim() };
    const request = this.editingId() ? this.http.patch<Tool>(`${this.apiUrl}/tools/${this.editingId()}`, payload) : this.http.post<Tool>(`${this.apiUrl}/tools`, payload);
    request.subscribe({ next: () => this.finishAction('tool'), error: (response) => this.failAction(response) });
  }

  deleteTool(tool: Tool): void {
    this.askDelete(`Delete ${tool.name}?`, () => this.runDelete(`${this.apiUrl}/tools/${tool.id}`, () => this.tools.update((items) => items.filter((item) => item.id !== tool.id))));
  }

  openAddResident(): void {
    this.editingId.set(null);
    Object.assign(this.residentForm, { name: '', email: '', phoneNumber: '' });
    this.openModal('resident');
  }

  openEditResident(resident: Resident): void {
    this.http.get<Resident>(`${this.apiUrl}/residents/${resident.id}`).subscribe({
      next: (loadedResident) => { this.editingId.set(loadedResident.id); Object.assign(this.residentForm, loadedResident); this.openModal('resident'); },
      error: (response) => this.actionError.set(this.readError(response)),
    });
  }

  saveResident(): void {
    if (!this.residentForm.name.trim() || !this.residentForm.email.trim() || !this.residentForm.phoneNumber.trim()) return this.actionError.set('Name, email, and phone number are required.');
    this.saving.set(true);
    const payload = { ...this.residentForm, name: this.residentForm.name.trim(), email: this.residentForm.email.trim(), phoneNumber: this.residentForm.phoneNumber.trim() };
    const request = this.editingId() ? this.http.patch<Resident>(`${this.apiUrl}/residents/${this.editingId()}`, payload) : this.http.post<Resident>(`${this.apiUrl}/residents`, payload);
    request.subscribe({ next: () => this.finishAction('resident'), error: (response) => this.failAction(response) });
  }

  deleteResident(resident: Resident): void {
    this.askDelete(`Delete ${resident.name}?`, () => this.runDelete(`${this.apiUrl}/residents/${resident.id}`, () => this.residents.update((items) => items.filter((item) => item.id !== resident.id))));
  }

  openAddLoan(): void {
    this.editingId.set(null);
    Object.assign(this.loanForm, { toolId: this.tools().find((tool) => tool.status === 'Available')?.id ?? 0, borrowerId: this.residents()[0]?.id ?? 0 });
    this.openModal('loan');
  }

  saveLoan(): void {
    if (!this.loanForm.toolId || !this.loanForm.borrowerId) return this.actionError.set('Choose an available tool and a borrower.');
    this.saving.set(true);
    this.http.post<Loan>(`${this.apiUrl}/loans`, this.loanForm).subscribe({ next: () => this.finishAction('loan'), error: (response) => this.failAction(response) });
  }

  inspectLoan(loan: Loan): void {
    this.http.get<Loan>(`${this.apiUrl}/loans/${loan.id}`).subscribe({ next: (loadedLoan) => this.detailLoan.set(loadedLoan), error: (response) => this.actionError.set(this.readError(response)) });
  }

  returnLoan(loan: Loan): void {
    const returnDate = this.returnDates.get(loan.id) ?? this.toDateTimeInput(new Date());
    this.saving.set(true);
    this.http.patch<Loan>(`${this.apiUrl}/loans/${loan.id}`, { returnDate: new Date(returnDate).toISOString() }).subscribe({ next: () => this.finishAction(), error: (response) => this.failAction(response) });
  }

  deleteLoan(loan: Loan): void {
    this.askDelete(`Delete this ${loan.returnDate ? 'completed' : 'active'} loan?`, () => this.runDelete(`${this.apiUrl}/loans/${loan.id}`, () => this.loans.update((items) => items.filter((item) => item.id !== loan.id))));
  }

  closeModal(): void { this.modal.set(null); this.actionError.set(''); this.saving.set(false); }
  closeLoanDetail(): void { this.detailLoan.set(null); }
  openModal(modal: Modal): void { this.actionError.set(''); this.modal.set(modal); }
  cancelDelete(): void { this.deleteConfirmation.set(null); }
  confirmDelete(): void { const confirmation = this.deleteConfirmation(); this.deleteConfirmation.set(null); confirmation?.onConfirm(); }
  returnDate(loan: Loan): string { return this.returnDates.get(loan.id) ?? this.toDateTimeInput(new Date()); }
  formatDate(date: string): string { return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }

  private loadLibrary(): void {
    this.http.get<Tool[]>(`${this.apiUrl}/tools`).subscribe({ next: (items) => this.tools.set(items), error: (response) => this.error.set(this.readError(response)) });
    this.http.get<Resident[]>(`${this.apiUrl}/residents`).subscribe({ next: (items) => this.residents.set(items), error: (response) => this.error.set(this.readError(response)) });
    this.http.get<Loan[]>(`${this.apiUrl}/loans`).subscribe({ next: (items) => this.loans.set(items), error: (response) => this.error.set(this.readError(response)) });
    setTimeout(() => this.loading.set(false), 450);
  }

  private refresh(): void {
    this.http.get<Tool[]>(`${this.apiUrl}/tools`).subscribe({ next: (items) => this.tools.set(items) });
    this.http.get<Resident[]>(`${this.apiUrl}/residents`).subscribe({ next: (items) => this.residents.set(items) });
    this.http.get<Loan[]>(`${this.apiUrl}/loans`).subscribe({ next: (items) => this.loans.set(items) });
  }

  private finishAction(modal?: Modal): void { this.saving.set(false); this.actionError.set(''); if (modal) this.modal.set(null); this.refresh(); }
  private failAction(response: { error?: unknown }): void { this.saving.set(false); this.actionError.set(this.readError(response)); }
  private runDelete(url: string, update: () => void): void { this.http.delete(url).subscribe({ next: () => { update(); this.refresh(); }, error: (response) => this.actionError.set(this.readError(response)) }); }
  private askDelete(message: string, onConfirm: () => void): void { this.actionError.set(''); this.deleteConfirmation.set({ message, onConfirm }); }
  private toDateTimeInput(date: Date): string { const offset = date.getTimezoneOffset() * 60000; return new Date(date.getTime() - offset).toISOString().slice(0, 16); }

  private readError(response: { error?: unknown }): string {
    if (typeof response.error === 'string') return response.error;
    if (response.error && typeof response.error === 'object') {
      const problem = response.error as { errors?: Record<string, string[]>; title?: string };
      const messages = Object.values(problem.errors ?? {}).flat();
      if (messages.length) return messages.join(' ');
      if (problem.title) return problem.title;
    }
    return 'The request could not be completed. Check that the API is running.';
  }
}
