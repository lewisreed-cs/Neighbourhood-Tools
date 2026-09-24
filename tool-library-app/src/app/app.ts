import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Tool {
  id: number;
  name: string;
  description: string;
  weight: number;
  status: string;
  ownerId: number;
}

interface Resident {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
}

interface Loan {
  id: number;
  toolId: number;
  borrowerId: number;
  loanDate: string;
  returnDate: string | null;
}

type View = 'overview' | 'tools' | 'residents' | 'loans';
type Modal = 'tool' | 'resident' | 'loan' | null;

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiUrl = 'http://localhost:5049/api';

  protected readonly tools = signal<Tool[]>([]);
  protected readonly residents = signal<Resident[]>([]);
  protected readonly loans = signal<Loan[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly actionError = signal('');
  protected readonly search = signal('');
  protected readonly activeFilter = signal<'all' | 'available' | 'loaned'>('all');
  protected readonly activeView = signal<View>('overview');
  protected readonly modal = signal<Modal>(null);
  protected readonly editingId = signal<number | null>(null);
  protected readonly saving = signal(false);
  protected readonly detailLoan = signal<Loan | null>(null);
  protected readonly returnDates = new Map<number, string>();

  protected readonly toolForm = { name: '', description: '', weight: 1, ownerId: 0 };
  protected readonly residentForm = { name: '', email: '', phoneNumber: '' };
  protected readonly loanForm = { toolId: 0, borrowerId: 0 };

  protected readonly filteredTools = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.tools().filter((tool) => {
      const matchesFilter = this.activeFilter() === 'all'
        || (this.activeFilter() === 'available' && tool.status === 'Available')
        || (this.activeFilter() === 'loaned' && tool.status === 'On Loan');
      const matchesSearch = !query
        || tool.name.toLowerCase().includes(query)
        || tool.description.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  });

  protected readonly activeLoans = computed(() => this.loans().filter((loan) => !loan.returnDate));

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadLibrary();
    } else {
      this.loading.set(false);
    }
  }

  protected navigate(view: View): void {
    this.activeView.set(view);
    this.actionError.set('');
    this.search.set('');
  }

  protected ownerName(ownerId: number): string {
    return this.residents().find((resident) => resident.id === ownerId)?.name ?? 'Unknown owner';
  }

  protected borrowerName(borrowerId: number): string {
    return this.residents().find((resident) => resident.id === borrowerId)?.name ?? 'Unknown borrower';
  }

  protected toolName(toolId: number): string {
    return this.tools().find((tool) => tool.id === toolId)?.name ?? 'Unknown tool';
  }

  protected setFilter(filter: 'all' | 'available' | 'loaned'): void {
    this.activeFilter.set(filter);
  }

  protected openAddTool(): void {
    this.editingId.set(null);
    Object.assign(this.toolForm, { name: '', description: '', weight: 1, ownerId: this.residents()[0]?.id ?? 0 });
    this.openModal('tool');
  }

  protected openEditTool(tool: Tool): void {
    this.actionError.set('');
    this.http.get<Tool>(`${this.apiUrl}/tools/${tool.id}`).subscribe({
      next: (loadedTool) => {
        this.editingId.set(loadedTool.id);
        Object.assign(this.toolForm, loadedTool);
        this.openModal('tool');
      },
      error: (response) => this.actionError.set(this.readError(response)),
    });
  }

  protected saveTool(): void {
    if (!this.toolForm.name.trim() || !this.toolForm.ownerId) {
      this.actionError.set('Add a name and choose an owner to continue.');
      return;
    }
    this.saving.set(true);
    this.actionError.set('');
    const payload = { ...this.toolForm, name: this.toolForm.name.trim(), description: this.toolForm.description.trim() };
    const request = this.editingId()
      ? this.http.patch<Tool>(`${this.apiUrl}/tools/${this.editingId()}`, payload)
      : this.http.post<Tool>(`${this.apiUrl}/tools`, payload);
    request.subscribe({
      next: () => this.finishAction('tool'),
      error: (response) => this.failAction(response),
    });
  }

  protected deleteTool(tool: Tool): void {
    if (!confirm(`Delete ${tool.name}?`)) return;
    this.runDelete(`${this.apiUrl}/tools/${tool.id}`, () => this.tools.update((items) => items.filter((item) => item.id !== tool.id)));
  }

  protected openAddResident(): void {
    this.editingId.set(null);
    Object.assign(this.residentForm, { name: '', email: '', phoneNumber: '' });
    this.openModal('resident');
  }

  protected openEditResident(resident: Resident): void {
    this.http.get<Resident>(`${this.apiUrl}/residents/${resident.id}`).subscribe({
      next: (loadedResident) => {
        this.editingId.set(loadedResident.id);
        Object.assign(this.residentForm, loadedResident);
        this.openModal('resident');
      },
      error: (response) => this.actionError.set(this.readError(response)),
    });
  }

  protected saveResident(): void {
    if (!this.residentForm.name.trim() || !this.residentForm.email.trim() || !this.residentForm.phoneNumber.trim()) {
      this.actionError.set('Name, email, and phone number are required.');
      return;
    }
    this.saving.set(true);
    this.actionError.set('');
    const payload = { ...this.residentForm, name: this.residentForm.name.trim(), email: this.residentForm.email.trim(), phoneNumber: this.residentForm.phoneNumber.trim() };
    const request = this.editingId()
      ? this.http.patch<Resident>(`${this.apiUrl}/residents/${this.editingId()}`, payload)
      : this.http.post<Resident>(`${this.apiUrl}/residents`, payload);
    request.subscribe({
      next: () => this.finishAction('resident'),
      error: (response) => this.failAction(response),
    });
  }

  protected deleteResident(resident: Resident): void {
    if (!confirm(`Delete ${resident.name}?`)) return;
    this.runDelete(`${this.apiUrl}/residents/${resident.id}`, () => this.residents.update((items) => items.filter((item) => item.id !== resident.id)));
  }

  protected openAddLoan(): void {
    this.editingId.set(null);
    Object.assign(this.loanForm, { toolId: this.tools().find((tool) => tool.status === 'Available')?.id ?? 0, borrowerId: this.residents()[0]?.id ?? 0 });
    this.openModal('loan');
  }

  protected saveLoan(): void {
    if (!this.loanForm.toolId || !this.loanForm.borrowerId) {
      this.actionError.set('Choose an available tool and a borrower.');
      return;
    }
    this.saving.set(true);
    this.actionError.set('');
    this.http.post<Loan>(`${this.apiUrl}/loans`, this.loanForm).subscribe({
      next: () => this.finishAction('loan'),
      error: (response) => this.failAction(response),
    });
  }

  protected inspectLoan(loan: Loan): void {
    this.http.get<Loan>(`${this.apiUrl}/loans/${loan.id}`).subscribe({
      next: (loadedLoan) => this.detailLoan.set(loadedLoan),
      error: (response) => this.actionError.set(this.readError(response)),
    });
  }

  protected returnLoan(loan: Loan): void {
    const returnDate = this.returnDates.get(loan.id) ?? this.toDateTimeInput(new Date());
    this.returnDates.set(loan.id, returnDate);
    this.saving.set(true);
    this.actionError.set('');
    this.http.patch<Loan>(`${this.apiUrl}/loans/${loan.id}`, { returnDate: new Date(returnDate).toISOString() }).subscribe({
      next: () => this.finishAction(),
      error: (response) => this.failAction(response),
    });
  }

  protected deleteLoan(loan: Loan): void {
    if (!confirm(`Delete this ${loan.returnDate ? 'completed' : 'active'} loan?`)) return;
    this.runDelete(`${this.apiUrl}/loans/${loan.id}`, () => this.loans.update((items) => items.filter((item) => item.id !== loan.id)));
  }

  protected closeModal(): void {
    this.modal.set(null);
    this.actionError.set('');
    this.saving.set(false);
  }

  protected closeLoanDetail(): void {
    this.detailLoan.set(null);
  }

  protected openModal(modal: Modal): void {
    this.actionError.set('');
    this.modal.set(modal);
  }

  protected formatDate(date: string): string {
    return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  protected returnDate(loan: Loan): string {
    return this.returnDates.get(loan.id) ?? this.toDateTimeInput(new Date());
  }

  private loadLibrary(): void {
    this.loading.set(true);
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

  private finishAction(modal?: Modal): void {
    this.saving.set(false);
    this.actionError.set('');
    if (modal) this.modal.set(null);
    this.refresh();
  }

  private failAction(response: { error?: unknown }): void {
    this.saving.set(false);
    this.actionError.set(this.readError(response));
  }

  private runDelete(url: string, update: () => void): void {
    this.actionError.set('');
    this.http.delete(url).subscribe({
      next: () => { update(); this.refresh(); },
      error: (response) => this.actionError.set(this.readError(response)),
    });
  }

  private toDateTimeInput(date: Date): string {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

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
