import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LibraryService } from '../../library.service';

@Component({
  selector: 'app-loans',
  imports: [CommonModule, FormsModule],
  templateUrl: './loans.component.html',
})
export class LoansComponent {
  readonly library = inject(LibraryService);
}
