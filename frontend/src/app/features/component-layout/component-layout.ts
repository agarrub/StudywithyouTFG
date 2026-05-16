import { Component } from '@angular/core';
import { NavigationHeader } from "../navigation-header/navigation-header";
import { NavigationSidebar } from "../navigation-sidebar/navigation-sidebar";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-component-layout',
  imports: [NavigationHeader, NavigationSidebar, RouterOutlet],
  templateUrl: './component-layout.html',
  styleUrl: './component-layout.scss',
})
export class ComponentLayout {

}
