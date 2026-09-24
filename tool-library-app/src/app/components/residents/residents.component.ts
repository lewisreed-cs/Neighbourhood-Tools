import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LibraryService } from '../../library.service';

@Component({
  selector: 'app-residents',
  imports: [CommonModule],
  templateUrl: './residents.component.html',
})
export class ResidentsComponent {
  readonly library = inject(LibraryService);
}
