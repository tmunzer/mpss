import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { PlatformLocation } from '@angular/common';
import { TwoFactorDialog } from './login-2FA';

export interface TwoFactorData {
  twoFactor: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})


export class LoginComponent implements OnInit {

  constructor(private _formBuilder: FormBuilder, private _http: HttpClient, private _router: Router, public _dialog: MatDialog, private _platformLocation: PlatformLocation
  ) { }

  host: string = "";
  show_github_fork_me: boolean = false;
  hostnames_to_show_github_fork_me = ["mso.mist-lab.fr"];
  loading: boolean;
  hosts = [
    { value: 'api.mist.com', viewValue: 'US - manage.mist.com' },
    { value: 'api.eu.mist.com', viewValue: 'EU - manage.eu.mist.com' },
    { value: 'api.gc1.mist.com', viewValue: 'GCP - manage.gc1.mist.com' }
  ];

  // LOGIN FORM
  frmStepLogin = this._formBuilder.group({
    host: [''],
    username: [''],
    password: ['']
  });
  error_message = ''


  //// INIT ////
  ngOnInit(): void {
    if (this.hostnames_to_show_github_fork_me.indexOf(this._platformLocation.hostname) >= 0) {
      this.show_github_fork_me = true;
    }
    this.frmStepLogin = this._formBuilder.group({
      host: ['api.mist.com'],
      username: [''],
      password: ['']
    });
  }

  //// COMMON ////
  check_host(): boolean {
    if (this.frmStepLogin.value.host != '') {
      return true;
    } else {
      return false;
    }
  }

  // RESET AUTHENTICATION FORM
  reset_response(): void {
    this.host = null;
    this.error_message = ''
  }

  // PARSE AUTHENTICATION RESPONSE FROM SERVER
  parse_response(data): void {
    this.loading = false;
    if ("error" in data) {
      this.error_message = data.error;
    } else if ("result" in data) {
      if (data.result == "two_factor_required") {
        this.open2FA()
      }
      else if (data.result == "success") {
        this.authenticated()
      } else this.error_message = "Unkown error"
    } else this.error_message = "Unkown error"

  }

  // WHEN AUTHENTICATION IS NOT OK
  parse_error(message): void {
    this.loading = false;
    console.log(message)
    this.error_message = message;
  }


  // WHEN AUTHENTICATION IS OK
  authenticated(): void {
    this.loading = false;
    this._router.navigate(['/admin/orgs']);
  }

  //// AUTHENTICATION ////
  submitCredentials(): void {
    this.reset_response();
    if (this.check_host()) {
      this.loading = true;
      this._http.post<any>('/api/admin/login', { host: this.frmStepLogin.value.host, username: this.frmStepLogin.value.username, password: this.frmStepLogin.value.password }).subscribe({
        next: data => this.parse_response(data),
        error: error => this.parse_error(error.error)
      })
    }
  }
  submit2FA(twoFactor: number): void {
    if (this.check_host()) {
      this.loading = true;
      console.log(this.frmStepLogin)
      this._http.post<any>('/api/admin/login', { host: this.frmStepLogin.value.host, username: this.frmStepLogin.value.username, password: this.frmStepLogin.value.password, two_factor_code: twoFactor }).subscribe({
        next: data => this.parse_response(data),
        error: error => this.parse_error(error.error)
      })
    }
  }

  //// DIALOG BOX ////
  open2FA(): void {
    const dialogRef = this._dialog.open(TwoFactorDialog, {});
    dialogRef.afterClosed().subscribe(result => {
      if (result) { this.submit2FA(result) }
    });
  }
}