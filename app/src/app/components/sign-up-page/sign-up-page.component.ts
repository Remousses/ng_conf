import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

import { UserInformations } from 'src/app/interfaces/generic/UserInformations.model';
import { CfCreneau } from 'src/app/interfaces/ConfFormData.model';

import { GenericDialogComponent } from '../dialogs/generic-dialog/generic-dialog.component';
import { DeleteUserDialogComponent } from '../dialogs/delete-user-dialog/delete-user-dialog.component';
import { UpdateUserDialogComponent } from '../dialogs/update-user-dialog/update-user-dialog.component';
import { AlreadyUserExistComponent } from '../dialogs/already-user-exist/already-user-exist.component';
import { BottomSheetOverviewComponent } from 'src/app/components/bottom-sheet-overview/bottom-sheet-overview.component';

import { ConferencesService } from 'src/app/services/conferences/conferences.service';
import { EmailService } from 'src/app/services/email/email.service';
import { GuestsService } from 'src/app/services/guests/guests.service';
import { MobileService } from 'src/app/services/mobile/mobile.service';
import { LoaderService } from 'src/app/services/loader/loader.service';

import DialogTemplate from 'src/app/interfaces/DialogTemplate.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-sign-up-page',
  templateUrl: './sign-up-page.component.html',
  styleUrls: ['./sign-up-page.component.scss']
})
export class SignUpPageComponent implements OnInit {

  userForm: FormGroup;
  situation: string;
  placeHolderSituationCompany: string;
  placeHolderSituationPosition: string;
  confForm: FormGroup = new FormGroup({});
  validatedUserFormValue: any = {};
  utilsUserForm: any = {};
  validatedConfFormValue: any = {};
  utilsConfForm: any = {};
  noneString = 'Aucune';
  cfCreneau: Array<CfCreneau>;
  isUpdating = false;
  alreadyRegistered = false;
  isMobile: boolean;
  env = environment;
  constructor(private formBuilder: FormBuilder,
              private conferencesService: ConferencesService,
              private guestsService: GuestsService,
              public emailService: EmailService,
              public dialog: MatDialog,
              private ngRoute: ActivatedRoute,
              public mobSvc: MobileService,
              public loaderService: LoaderService,
              private bottomSheet: MatBottomSheet
  ) { }

  ngOnInit() {
    this.initSituationValues();
    this.loaderService.setSpinnerState(true);
    // this.mockCreneau = this.conferencesService.mockCreneau;
    this.initUserInfoForm();
    this.conferencesService.getConfFormData().subscribe(res => {
      this.loaderService.setSpinnerState(false);
      this.cfCreneau = res;
      this.initConfForm();
    }, err => {
      this.loaderService.setSpinnerState(false);
      console.log('Error from APIs', err);
      this.dialog.open(GenericDialogComponent, {
        width: 'auto',
        data: DialogTemplate.modalTempates.internalServerError()
      });
    });

    this.ngRoute.queryParams.subscribe(event => {
      this.checkURI(event);
    });
  }

  private initSituationValues() {
    this.situation = 'salarie';
    this.placeHolderSituationCompany = 'Nom de votre entreprise';
    this.placeHolderSituationPosition = 'Nom de votre poste';
  }

  public getConfRecap(i: number) {
    return this.utilsConfForm[i].confName;
  }

  private checkURI(event: any) {
    const userdata = event.userdata;

    if (userdata) {
      this.loaderService.setSpinnerState(true);
      let user: UserInformations;
      try {
        user = JSON.parse(atob(userdata));
      } catch (e) {
        this.loaderService.setSpinnerState(false);
        console.log('JSON parse exeption : ', e);
        this.dialog.open(GenericDialogComponent, {
          width: 'auto',
          data: DialogTemplate.modalTempates.tokenNotMatch(user)
        });
        return;
      }

      if (user.email) {
        if (event.checkToken) {
          this.checkToken(userdata, user);
        } else if (event.update) {
          this.loaderService.setSpinnerState(false);
          const updateRef = this.dialog.open(UpdateUserDialogComponent, {
            width: 'auto',
            data: (user)
          });
          updateRef.componentInstance.onUpdate.subscribe(() => {
            this.isUpdating = true;
            this.initFormValues(user);
          });
        } else if (event.delete) {
          this.loaderService.setSpinnerState(false);
          this.dialog.open(DeleteUserDialogComponent, {
            width: 'auto',
            data: (user)
          });
        }
      }
    }
  }

  private checkToken(userdata: any, user: any) {
    if (user.token) {
      this.loaderService.setSpinnerState(true);
      // Conf name in QRCode with/ getAllConfName
      Promise.all(this.getAllConfName(user)).then(allConfName => {
        console.log('Retrieving all conference names for ' + user.email + ' user');
        this.guestsService.confirmUser(user.email, user.token).subscribe(verifResult => {
          this.checkCreate(userdata, verifResult, user, allConfName, 'successfullSignUpMail', true);
        }, err => {
          this.loaderService.setSpinnerState(false);
          this.dialog.open(GenericDialogComponent, {
            width: 'auto',
            data: DialogTemplate.modalTempates.internalServerError()
          });
        });
      }).catch(err => {
        this.loaderService.setSpinnerState(false);
        console.log('Error when calling getAllConfName :', err);
        this.dialog.open(GenericDialogComponent, {
          width: 'auto',
          data: DialogTemplate.modalTempates.confError()
        });
      });
    }
  }

  updateUserData() {
    if (this.isUpdating) {
      this.loaderService.setSpinnerState(true);

      this.ngRoute.queryParams.subscribe(event => {
        const token = JSON.parse(atob(event.userdata)).token;

        const userdata = btoa(JSON.stringify({
          lName: this.userForm.get('lName').value,
          fName: this.userForm.get('fName').value,
          company: this.userForm.get('company').value,
          email: this.userForm.get('email').value,
          position: this.userForm.get('position').value,
          vehicle: this.userForm.get('vehicle').value,
          token,
          hasValidate: true,
          conferences: this.utilsConfForm.ids
        }));

        const user = JSON.parse(atob(userdata));

        // Conf name in QRCode with getAllConfName
        Promise.all(this.getAllConfName(user)).then(allConfName => {
          console.log('Retrieving all conference names for ' + user.email + ' user');
          this.guestsService.updateUser(user).subscribe(verifResult => {
            this.checkCreate(userdata, verifResult, user, allConfName, 'successfullUpdateSignUpMail', false);
          }, err => {
            console.log('Error getting conferences data', err);
            this.loaderService.setSpinnerState(false);
            this.dialog.open(GenericDialogComponent, {
              width: 'auto',
              data: DialogTemplate.modalTempates.updateUserError()
            });
          });
        }).catch(err => {
          this.loaderService.setSpinnerState(false);
          console.log('Error when calling getAllConfName :', err);
          this.dialog.open(GenericDialogComponent, {
            width: 'auto',
            data: DialogTemplate.modalTempates.confError()
          });
        });
      });
    }
  }

  private checkCreate(userdata: any, verifResult: any, user: UserInformations, allConfName: any[], templateName: string, successDialog: boolean) {
    if (!verifResult.success) {
      this.loaderService.setSpinnerState(false);
      this.handleErrorDialog(verifResult.type, user, verifResult.hasValidate);
    } else {
      console.log('successfully registred');
      this.emailService.sendEmail(
        {
          templateName,
          data: {
            userdata,
            from: 'msia',
            to: user.email,
            templateOptions: {
              lName: user.lName,
              fName: user.fName,
              company: user.company,
              conferences: allConfName
            }
          }
        }).subscribe(() => {
          this.loaderService.setSpinnerState(false);
          this.dialog.open(GenericDialogComponent, {
            width: 'auto',
            data: successDialog ? DialogTemplate.modalTempates.successful(user) : DialogTemplate.modalTempates.updateUserSuccess(user)
          });
        }, err => {
          this.loaderService.setSpinnerState(false);
          console.log('Error from APIs during token checks', err);
          this.dialog.open(GenericDialogComponent, {
            width: 'auto',
            data: DialogTemplate.modalTempates.internalServerError(user)
          });
        });
    }
  }

  initFormValues(user: any/*UserInformations*/) {
    // this.userForm.controls.email.disable();
    Object.keys(this.userForm.controls).forEach(key => {
      if (user.hasOwnProperty(key)) {
        this.userForm.get(key).setValue(user[key]);
      } else {
        // Situation
        if (user.company === 'Autre') {
          this.userForm.get('situation').setValue('autre');
          this.placeHolderSituationCompany = 'Autre';
          this.placeHolderSituationPosition = 'Quel est votre situation';
        } else if (user.position === 'Etudiant(e)') {
          this.userForm.get('situation').setValue('etudiant');
          this.placeHolderSituationCompany = 'Nom de votre école';
          this.placeHolderSituationPosition = 'Statut';
        } else {
          this.userForm.get('situation').setValue('salarie');
          this.placeHolderSituationCompany = 'Nom de votre entreprise';
          this.placeHolderSituationPosition = 'Nom de votre poste';
        }
      }
    });
  }

  private getAllConfName(user: UserInformations): any[] {
    return user.conferences.map((confId) => {
      return new Promise((resolve, reject) => {
        this.conferencesService.getConfName(confId).subscribe(conference => {
          resolve(conference.confName);
        }, err => {
          this.loaderService.setSpinnerState(false);
          this.dialog.open(GenericDialogComponent, {
            width: 'auto',
            data: DialogTemplate.modalTempates.confError()
          });
        });
      });
    });
  }

  private handleErrorDialog(verifResultType: string, user: UserInformations, hasValidate: boolean) {
    switch (verifResultType) {
      case 'alreadyRegistered':
        this.dialog.open(AlreadyUserExistComponent, {
          width: 'auto',
          data: {
            email: user.email,
            hasValidate
          }
        });
        break;

      case 'userNotFoundAfterTokenValidation':
        this.dialog.open(GenericDialogComponent, {
          width: 'auto',
          data: DialogTemplate.modalTempates.userNotFound(user)
        });
        break;
      case 'tokenNotMatch':
        this.dialog.open(GenericDialogComponent, {
          width: 'auto',
          data: DialogTemplate.modalTempates.tokenNotMatch(user)
        });
        break;

      case 'updateError':
        this.dialog.open(GenericDialogComponent, {
          width: 'auto',
          data: DialogTemplate.modalTempates.updateError(user)
        });
        break;

      case 'emailNotFound':
        this.dialog.open(GenericDialogComponent, {
          width: 'auto',
          data: DialogTemplate.modalTempates.userNotFound(user)
        });
        break;

      default:
        break;
    }
  }

  initUserInfoForm() {
    this.userForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email, Validators.maxLength(70)]],
      fName: ['', [Validators.required, Validators.maxLength(50), Validators.minLength(2)]],
      lName: ['', [Validators.required, Validators.maxLength(50), Validators.minLength(2)]],
      situation: ['salarie', [Validators.required]],
      company: ['', [Validators.required, Validators.maxLength(50), Validators.minLength(2)]],
      position: ['', [Validators.required, Validators.maxLength(60), Validators.minLength(2)]],
      vehicle: [false, [Validators.required]],
      rgpd: [false, [Validators.requiredTrue]]
    });
  }

  initConfForm() {
    this.confForm = this.formBuilder.group({});
    this.cfCreneau.forEach(creneau => {
      this.confForm.addControl(creneau.crenId.toString(), this.formBuilder.control(null, [Validators.required]));
    });
  }

  onSubmitUserInfo() {
    const userFormValue = this.userForm.value;
    this.validatedUserFormValue = this.userForm.value;
    this.utilsUserForm.keys = Object.keys(this.validatedUserFormValue);
    // console.log('User form values', userFormValue);
  }

  onSubmitConf() {
    const confFormValue = this.confForm.value;
    this.validatedConfFormValue = confFormValue;
    this.utilsConfForm.conf = Object.keys(this.validatedConfFormValue).map((key, i) => this.validatedConfFormValue[i + 1]);
    this.utilsConfForm.ids = Object.keys(this.validatedConfFormValue).map((key, i) => {
      if (this.validatedConfFormValue[i + 1] === '-1') {
        return -1;
      } else {
        return this.validatedConfFormValue[i + 1].confId;
      }
    });
    // Mettre un message d'erreur si l'utilisateur choisi partout "Aucune" ?
    // console.log('Conf form values', confFormValue, this.utilsConfForm);
  }

  validateSignUp() {
    this.loaderService.setSpinnerState(true);
    const u = this.validatedUserFormValue;
    const token = this.generateToken(16);
    const user = new UserInformations(u.lName, u.fName, u.company, u.email, u.position, u.vehicle, false, token, this.utilsConfForm.ids);

    this.guestsService.createUser(user).subscribe(data => {
      console.log('this.loaderService', this.loaderService);
      if (data.err) {
        this.loaderService.setSpinnerState(false);
        this.dialog.open(AlreadyUserExistComponent, {
          width: 'auto',
          data: {
            email: user.email,
            hasValidate: true
          }
        });
      } else {
        console.log('Sending email confirmation');
        const route = environment.production ? '' : '/dev';
        this.emailService.sendEmail(
          {
            templateName: 'tokenMail',
            data: {
              from: 'msia',
              to: user.email,
              templateOptions: {
                fName: user.fName,
                url: 'https://msia17conferences.com' + route + '/inscription?' + this.encodeData({
                  userdata: btoa(JSON.stringify({
                    lName: user.lName,
                    fName: user.fName,
                    company: user.company,
                    email: user.email,
                    position: user.position,
                    vehicle: user.vehicle,
                    token: user.token,
                    conferences: user.conferences
                  })),
                  checkToken: true
                })
              }
            }
          }).subscribe(mailRes => {
            this.loaderService.setSpinnerState(false);

            if (!mailRes.success) {
              console.log('Error sending mail', mailRes.err);
              this.dialog.open(GenericDialogComponent, {
                width: 'auto',
                data: DialogTemplate.modalTempates.internalServerError(user)
              });
              return;
            }
            this.dialog.open(GenericDialogComponent, {
              width: 'auto',
              data: DialogTemplate.modalTempates.tokenSent(user)
            });
          }, err => {
            this.loaderService.setSpinnerState(false);
            console.log('Error from APIs', err);
            this.dialog.open(GenericDialogComponent, {
              width: 'auto',
              data: DialogTemplate.modalTempates.internalServerError(user)
            });
          });
      }
    }, err => {
      this.loaderService.setSpinnerState(false);
      console.log('Error from APIs', err);
      this.dialog.open(GenericDialogComponent, {
        width: 'auto',
        data: DialogTemplate.modalTempates.internalServerError(user)
      });
    });
  }

  openBottomSheet() {
    this.bottomSheet.open(BottomSheetOverviewComponent);
  }

  reset(stepper: any) {
    stepper.reset();
    Object.keys(this.userForm.controls).forEach(key => {
      this.userForm.get(key).setErrors(null);
    });
  }

  setValueSituation(situation: string) {
    console.log('setValueSituation', situation);
    this.userForm.get('company').setValue('');
    this.userForm.get('position').setValue('');

    switch (situation) {
      case 'autre':
        this.userForm.get('company').setValue('Autre');
        this.placeHolderSituationCompany = 'Autre';
        this.placeHolderSituationPosition = 'Quel est votre situation';
        break;

      case 'etudiant':
        this.userForm.get('position').setValue('Etudiant(e)');
        this.placeHolderSituationCompany = 'Nom de votre école';
        this.placeHolderSituationPosition = 'Statut';
        break;

      case 'salarie':
        this.placeHolderSituationCompany = 'Nom de votre entreprise';
        this.placeHolderSituationPosition = 'Nom de votre poste';
        break;

      default:
        break;
    }
  }

  log() {
    console.log(this.utilsConfForm);

    // console.log(this.generateToken(16));
    // const u = this.validatedUserFormValue;
    // const user = new UserInformations(
    //   u.lName,
    //   u.fName,
    //   u.company,
    //   u.email,
    //   u.position,
    //   u.vehicle,
    //   false,
    //   '',
    //   this.utilsConfForm.ids
    // );
    // console.log('https://msia17conferences.com' + environment.production ? '' : '/dev' + '/inscription?userdata=' + this.encodeData({
    //   userdata: btoa(JSON.stringify(user)),
    //   token: this.generateToken(16)
    // }));
  }

  fillUserInfoForm() {
    this.userForm.setValue({
      email: 'willineito@gmail.com',
      fName: 'Willem',
      lName: 'Houm',
      situation: 'salarie',
      company: 'General Electrics',
      position: 'Apprenti Architecte Solution',
      vehicle: true,
      rgpd: true
    });
  }

  fillUserInfoFormRemy() {
    this.userForm.setValue({
      email: 'remousses@gmail.com',
      fName: 'Remousses',
      lName: 'Argentin',
      situation: 'salarie',
      company: 'CACF',
      position: 'Ingénieur Logiciel',
      vehicle: true,
      rgpd: true
    });
  }

  checkResendMail(email: string) {
    return !email.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/igm);
  }

  isNone(conf: string) {
    return conf === '-1';
  }

  private dec2hex(dec) {
    return ('0' + dec.toString(16)).substr(-2);
  }

  private generateToken(len) {
    const arr = new Uint8Array((len || 40) / 2);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, this.dec2hex).join('');
  }

  private encodeData(data) {
    return Object.keys(data).map(key => {
      return [key, data[key]].map(encodeURIComponent).join('=');
    }).join('&');
  }
}