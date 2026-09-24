import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LibraryService } from '../../library.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  readonly library = inject(LibraryService);

  setFilter(filter: 'all' | 'available' | 'loaned'): void {
    this.library.activeFilter.set(filter);
  }
}
