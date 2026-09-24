import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LibraryService } from '../../library.service';

@Component({
  selector: 'app-tools',
  imports: [CommonModule, FormsModule],
  templateUrl: './tools.component.html',
})
export class ToolsComponent {
  readonly library = inject(LibraryService);
}
