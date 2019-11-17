import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import DialogTemplate from 'src/app/interfaces/DialogTemplate.model';

import { EmailService } from 'src/app/services/email/email.service';
import { GenericDialogComponent } from '../dialogs/generic-dialog/generic-dialog.component';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {

  contactForm: FormGroup;

  constructor(private formBuilder: FormBuilder, private emailService: EmailService, public dialog: MatDialog) { }

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.contactForm = this.formBuilder.group({
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]],
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]],
      enterpriseName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      userEmail: ['', [Validators.required, Validators.email, Validators.minLength(2), Validators.maxLength(100)]],
      messageEmail: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(256)]]
    });
  }

  onSubmit() {
    const contactFormValue = this.contactForm.value;

    this.emailService.sendContactEmail(contactFormValue)
      .then(res => {
        this.dialog.open(GenericDialogComponent, {
          width: 'auto',
          data: DialogTemplate.modalTempates.contactResponseSuccess()
        });
        const messageEmail = this.f.messageEmail;
        messageEmail.setValue('');
        messageEmail.setErrors(null);
      })
      .catch(err => {
        console.log('Error when sending contact email : ', err);
        this.dialog.open(GenericDialogComponent, {
          width: 'auto',
          data: DialogTemplate.modalTempates.contactResponseError(contactFormValue)
        });
      });
  }

   // convenience getter for easy access to form fields
   get f() { return this.contactForm.controls; }
}
