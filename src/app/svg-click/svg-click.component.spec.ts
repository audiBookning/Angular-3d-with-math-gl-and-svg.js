import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SvgClickComponent } from './svg-click.component';

describe('SvgClickComponent', () => {
  let component: SvgClickComponent;
  let fixture: ComponentFixture<SvgClickComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SvgClickComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SvgClickComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
