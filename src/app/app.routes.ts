import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { VerifyComponent } from './components/verify/verify.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'verify', component: VerifyComponent },
  { path: '**', redirectTo: '' },
];
