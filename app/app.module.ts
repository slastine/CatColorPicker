import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GradientPickerComponent } from './gradient-picker/gradient-picker.component';
import { CatDisplayComponent } from './cat-display/cat-display.component';

@NgModule({
  declarations: [
    AppComponent,
    GradientPickerComponent,
    CatDisplayComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
