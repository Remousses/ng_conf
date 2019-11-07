import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HttpClientModule } from '@angular/common/http';
import { MarkdownModule } from 'ngx-markdown';
import {
  MatMenuModule, MatToolbarModule, MatIconModule,
  MatSidenavModule, MatListModule, MatButtonModule,
  MatStepperModule, MatInputModule, MatFormFieldModule,
  MatCheckboxModule, MatRadioModule, MatDialogModule,
  MatTabsModule
} from '@angular/material';

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { DefaultTemplateComponent } from './components/default-template/default-template.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { SignUpPageComponent } from './components/sign-up-page/sign-up-page.component';
import { AboutComponent } from './components/about/about.component';
import { ContactComponent } from './components/contact/contact.component';
import { OpenContactResponseDialogComponent } from './components/contact/manage/open-contact-response-dialog/open-contact-response-dialog.component';
import { ConferencesComponent } from './components/conferences/conferences.component';
import { AlreadyExistDialogComponent } from './components/sign-up-page/dialog/already-exist-dialog/already-exist-dialog.component';

import { ContactFormValidatorDirective } from './directives/contact-form-validator.directive';

import { EmailService } from './services/email/email.service';
import { ConferencesService } from './services/conferences/conferences.service';
import { TokenSentDialogComponent } from './components/sign-up-page/dialog/token-sent-dialog/token-sent-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    DefaultTemplateComponent,
    HomeComponent,
    SignUpComponent,
    SignUpPageComponent,
    AboutComponent,
    ContactComponent,
    // ContactFormValidatorDirective,
    OpenContactResponseDialogComponent,
    ConferencesComponent,
    AlreadyExistDialogComponent,
    TokenSentDialogComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    MatMenuModule,
    MatToolbarModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatButtonModule,
    MatStepperModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatRadioModule,
    MatDialogModule,
    MatTabsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    HttpClientModule,
    MarkdownModule.forRoot()
  ],
  entryComponents : [OpenContactResponseDialogComponent, AlreadyExistDialogComponent, TokenSentDialogComponent],
  providers: [EmailService, ConferencesService],
  bootstrap: [AppComponent]
})
export class AppModule { }
