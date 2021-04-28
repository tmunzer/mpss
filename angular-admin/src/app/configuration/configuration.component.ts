import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApitokenManualDialog } from './configuration.token.manual';
import { ConfirmDialog } from './configuration.confirm';

import { ErrorDialog } from './../common/error'
import { AdfsComponent } from './authentication/adfs/adfs.component';
import { AzureComponent } from './authentication/azure/azure.component';
import { GoogleComponent } from './authentication/google/google.component';
import { OktaComponent } from './authentication/okta/okta.component';

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.css']
})
export class ConfigurationComponent {

  @ViewChild(AdfsComponent) adfsComp;
  @ViewChild(AzureComponent) azureComp;
  @ViewChild(GoogleComponent) googleComp;
  @ViewChild(OktaComponent) oktaComp;

  constructor(private _router: Router, private _http: HttpClient, public _dialog: MatDialog, private _snackBar: MatSnackBar) { }


  //COMMON
  privilege: string = "";
  account_created: boolean = false;
  //TOKEN
  token = {
    configured: false,
    created_by: "",
    scope: "",
    can_delete: false,
    auto_mode: true
  }
  //PSK
  psk = {
    configured: false,
    config: {
    scope: "site",
    site_id: "",
    ssid: "",
    vlan_id: 0, 
    min: true,
    cap: false,
    num: true,
    spec: false,
    length: 12
  }
}
  sites;
  wlans;
  enable_vlan: boolean = false;
  // AUTH
  auth = {
    configured: false,
    host: "",
    org_id: "",
    method: null,
    config: {}
  }
  auth_methods = [
    { id: "adfs", name: "ADFS" },
    { id: "azure", name: "Azure" },
    { id: "google", name: "Google" },
    { id: "okta", name: "Okta" },
  ];

  is_working = false;
  portal_url = "https://";

  ngOnInit(): void {
    this.is_working = true;
    this._http.get<any>('/api/admin/config/').subscribe({
      next: data => {
        this.is_working = false;
        this.parse_response(data);
      },
      error: error => {
        this.parse_error(error);
      }
    })
  }


  parse_response(data): void {
    if (data.account_created) this.account_created = data.account_created;
    if (data.privilege) this.privilege = data.privilege;

    if (data.token) this.token = data.token;

    if (data.psk) {
      this.psk = data.psk;
      if (data.psk.vlan_id > 0) {
        this.enable_vlan = true
      }
    }

    if (data.auth) {
      this.auth = data.auth
    }

    if (data.wlans) {
      this.wlans = data.wlans
    }
    if (this.psk.config.scope == "site") {
      this.changeScope();
    }
    if (this.psk.config.site_id || this.psk.config.scope == "org") {
      this.getWlans();
    }
    if (data.portal_url) {
      this.portal_url = data.portal_url
    }
  }

  parse_error(data): void {
    this.is_working = false
    if (data.status == "401") {
      this._router.navigate(["/"])
    } else {
      var message: string = "Unable to contact the server... Please try again later... "
      if (data.error && data.error.message) message = data.error.message
      else if (data.error) message = data.error
      this.openSnackBar(message, "OK")
    }
  }


  //////////////////////////////////////////////////////////////////////////////
  /////           TOKEN
  //////////////////////////////////////////////////////////////////////////////
  getPortalUrl(): void {
    this._http.get("/api/admin/portal_url").subscribe({
      next: data => this.parse_response(data),
      error: error => this.parse_error(error)
    })
  }
  generateToken(scope: string): void {
    this.token.configured = false;
    this.token.auto_mode = true;
    this.is_working = true;
    this._http.post<any>('/api/admin/token', { scope: scope }).subscribe({
      next: data => {
        this.token.configured = true;
        this.token.auto_mode = true;
        this.is_working = false
        this.openSnackBar("New API Token created.", "Ok")
        this.getPortalUrl();
      },
      error: error => {
        this.parse_error(error)
      }
    })
  }

  saveManualToken(apitoken: string): void {
    this.token.configured = false;
    this.token.auto_mode = true;
    this.is_working = true;
    this._http.post<any>('/api/admin/token', { apitoken: apitoken }).subscribe({
      next: data => {
        this.token.configured = true;
        this.token.auto_mode = false;
        this.is_working = false
        this.openSnackBar("New API Token created.", "Ok")
      },
      error: error => {
        this.parse_error(error)
      }
    })
  }

  deleteToken(): void {
    this.is_working = true;
    const dialogRef = this._dialog.open(ConfirmDialog, { data: { title: "Delete Token", message: "This action will delete the API Token from the Mist Cloud." } });
    dialogRef.afterClosed().subscribe(result => {
      this.is_working = true
      if (result) {
        this._http.delete("/api/admin/token").subscribe({
          next: data => {
            this.is_working = false
            this.token.configured = false;
            this.token.auto_mode = true;
          },
          error: error => this.parse_error(error)
        })
      }
    })
  }


  //////////////////////////////////////////////////////////////////////////////
  /////           PSK
  //////////////////////////////////////////////////////////////////////////////

  changeScope(): void {
    this.is_working = true;
    this.sites = []
    this.wlans = []
    if (this.psk.config.scope === "site") {
      this._http.get("/api/admin/psk/sites").subscribe({
        next: data => {
          this.is_working = false;
          this.sites = data;
        },
        error: error => this.parse_error(error)
      })
    } else {
      this.is_working = false;
      this.sites = null;
      this.psk.config.site_id = null;
      this.getWlans();
    }
  }

  getWlans(): void {
    this.is_working = true;
    this.wlans = null
    if (this.psk.config.site_id) {
      var query = "?site_id=" + this.psk.config.site_id
    } else {
      var query = ""
    }
    this._http.get('/api/admin/psk/wlans' + query).subscribe({
      next: data => {
        this.is_working = false;
        this.wlans = data;
      },
      error: error => this.parse_error(error)
    })
  }

  savePskConfig(): void {
    this.is_working = true;
    if (!this.enable_vlan) {
      this.psk.config.vlan_id= 0
    }
    var data = this.psk.config
    this._http.post("/api/admin/psk", data).subscribe({
      next: data => {
        this.is_working = false;
        this.psk.configured = true;
      },
      error: error => this.parse_error(error)

    })
  }

  //////////////////////////////////////////////////////////////////////////////
  /////           AUTH
  //////////////////////////////////////////////////////////////////////////////

  saveAuth() {
    var data = {}
    if (this.auth.method == "adfs") {data = {config:this.adfsComp.adfs}} 
    else if (this.auth.method == "google") {data = {config:this.googleComp.google}} 
    else if (this.auth.method == "azure") {data = {config:this.azureComp.azure}} 
    else if (this.auth.method == "okta") {data = {config:this.oktaComp.okta}} 
    this._http.post("/api/admin/auth/" + this.auth.method, data).subscribe({
      next: data => {
        this.is_working = false;
        this.auth.configured = true;
      },
      error: error => this.parse_error(error)
    })
  }

  //////////////////////////////////////////////////////////////////////////////
  /////           DIALOG BOXES
  //////////////////////////////////////////////////////////////////////////////
  // ERROR
  openError(message: string): void {
    const dialogRef = this._dialog.open(ErrorDialog, {
      data: message
    });
  }

  // SNACK BAR
  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 5000,
      horizontalPosition: "center",
      verticalPosition: "top",
    });
  }

  //// DIALOG BOX ////
  openApitokenManual(): void {
    const dialogRef = this._dialog.open(ApitokenManualDialog, {});
    dialogRef.afterClosed().subscribe(result => {
      if (result) { this.saveManualToken(result) }
    });
  }
}