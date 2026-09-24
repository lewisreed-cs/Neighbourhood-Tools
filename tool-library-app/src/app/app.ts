import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoansComponent } from './components/loans/loans.component';
import { ResidentsComponent } from './components/residents/residents.component';
import { ToolsComponent } from './components/tools/tools.component';
import { LibraryService } from './library.service';
import { View } from './models';

@Component({
  imports: [CommonModule, FormsModule, DashboardComponent, ToolsComponent, ResidentsComponent, LoansComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  readonly library = inject(LibraryService);
  readonly activeView = signal<View>('overview');

  navigate(view: View): void {
    this.activeView.set(view);
    this.library.actionError.set('');
    this.library.search.set('');
  }

  pageTitle(): string {
    return this.activeView() === 'overview' ? 'Make something useful.' : this.activeView() === 'tools' ? 'The tool shed.' : this.activeView() === 'residents' ? 'The neighbourhood.' : 'Out in the world.';
  }

  pageDescription(): string {
    return this.activeView() === 'overview' ? 'Borrow what you need, share what you have, and keep good tools moving around the neighbourhood.' : 'Manage the shared resources that keep your local library useful.';
  }

  openCreate(): void {
    if (this.activeView() === 'residents') this.library.openAddResident();
    else if (this.activeView() === 'loans') this.library.openAddLoan();
    else this.library.openAddTool();
  }
}
