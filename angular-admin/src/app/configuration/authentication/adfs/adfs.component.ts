import { Component, Input, OnInit } from '@angular/core';

import { ErrorDialog } from '../../../common/error'

@Component({
  selector: 'app-configuration-adfs',
  templateUrl: './adfs.component.html',
  styleUrls: ['./../../configuration.component.css']
})
export class AdfsComponent implements OnInit {

  @Input()  auth: {
    server: string,
    entity_id: string,
    login_url: string,
    logout_url: string,
    entry_point: string,
    certs: string[],
    metadata: string
  }
  
  constructor() { }
  
  adfs: {
    server: string,
    entity_id: string,
    login_url: string,
    logout_url: string,
    entry_point: string,
    certs: string[],
    metadata: string
  }

  ngOnInit(): void { 
    if (this.auth && this.auth.metadata){
      this.adfs = {
        server: this.auth.server,
        entity_id: this.auth.entity_id,
        login_url: this.auth.login_url,
        logout_url: this.auth.logout_url,
        entry_point: this.auth.entry_point,
        certs: this.auth.certs,
        metadata: this.auth.metadata
      }      
    }else{
      this.adfs = {
        server: "",
        entity_id: "",
        login_url: "",
        logout_url: "",
        entry_point: "",
        certs: [],
        metadata: ""
      }
    }
  }

  changeAdfsMetadata(e) {
    this.adfs.server = "";
    this.adfs.entity_id = "";
    this.adfs.login_url = "";
    this.adfs.logout_url = "";
    this.adfs.entry_point = "";
    this.adfs.certs = [];

    if (this.adfs.metadata) {
      var start, stop;

      start = this.adfs.metadata.indexOf("entityID=") + 10;
      if (start) this.adfs.entity_id = this.adfs.metadata.substring(start, this.adfs.metadata.indexOf("\"", start));
      start = -1;

      start = this.adfs.metadata.indexOf("SingleSignOnService Binding=\"urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect\"");
      if (start) start = this.adfs.metadata.indexOf("Location=", start) + 10;
      if (start) this.adfs.login_url = this.adfs.metadata.substring(start, this.adfs.metadata.indexOf("\"", start));

      if (this.adfs.login_url) this.adfs.entry_point = this.adfs.login_url,

      start = -1;
      start = this.adfs.metadata.indexOf("SingleLogoutService Binding=\"urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect\"");
      if (start) start = this.adfs.metadata.indexOf("Location=", start) + 10;
      if (start) this.adfs.logout_url = this.adfs.metadata.substring(start, this.adfs.metadata.indexOf("\"", start));

      start = 0;
      stop = 0;
      var i = 0;
      while (start >= 0 && i < 10) {
        start = this.adfs.metadata.indexOf("<X509Certificate>", stop);
        if (start > 0) {
          stop = this.adfs.metadata.indexOf("</X509Certificate>", start);
          var cert = this.adfs.metadata.substring(start + 17, stop);
          if (this.adfs.certs.indexOf(cert) < 0) this.adfs.certs.push(cert);
        } else break;
        i++;
      }      
    }
  }

  adfsCert() {
    if (this.adfs.server) return "https://" + this.adfs.server + "/FederationMetadata/2007-06/FederationMetadata.xml";
    else return false;
  };

  isValid() {
    if (!this.adfs.entity_id || this.adfs.entity_id == "") return false;
    else if (!this.adfs.login_url || this.adfs.login_url == "") return false;
    else if (!this.adfs.logout_url || this.adfs.logout_url == "") return false;
    else return true;
  };


}
