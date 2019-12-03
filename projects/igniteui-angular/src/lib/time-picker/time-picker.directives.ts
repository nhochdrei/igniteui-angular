/**
 * This file contains all the directives used by the @link IgxTimePickerComponent.
 * You should generally not use them directly.
 * @preferred
 */
import { Directive, ElementRef, HostBinding, HostListener, Inject, Input, TemplateRef } from '@angular/core';
import { InteractionMode } from '../core/enums';
import { IgxTimePickerBase, IGX_TIME_PICKER_COMPONENT } from './time-picker.common';

/** @hidden */
@Directive({
    selector: '[igxItemList]'
})
export class IgxItemListDirective {

    @Input('igxItemList')
    public type: string;

    public isActive: boolean;

    constructor(@Inject(IGX_TIME_PICKER_COMPONENT)
    public timePicker: IgxTimePickerBase,
        private elementRef: ElementRef) { }

    @HostBinding('attr.tabindex')
    public tabindex = 0;

    @HostBinding('class.igx-time-picker__column')
    get defaultCSS(): boolean {
        return true;
    }

    @HostBinding('class.igx-time-picker__hourList')
    get hourCSS(): boolean {
        return this.type === 'hourList';
    }

    @HostBinding('class.igx-time-picker__minuteList')
    get minuteCSS(): boolean {
        return this.type === 'minuteList';
    }

    @HostBinding('class.igx-time-picker__ampmList')
    get ampmCSS(): boolean {
        return this.type === 'ampmList';
    }

    private lastDeltaY = 0;
    private sumDeltaY = 0;
    private stepSize = 45;

    @HostListener('focus')
    public onFocus() {
        this.isActive = true;
    }

    @HostListener('blur')
    public onBlur() {
        this.isActive = false;
    }

    private nextItem(): void {
        switch (this.type) {
            case 'hourList': {
                this.timePicker.nextHour();
                break;
            }
            case 'minuteList': {
                this.timePicker.nextMinute();
                break;
            }
            case 'ampmList': {
                this.timePicker.nextAmPm();
                break;
            }
        }
    }

    private prevItem(): void {
        switch (this.type) {
            case 'hourList': {
                this.timePicker.prevHour();
                break;
            }
            case 'minuteList': {
                this.timePicker.prevMinute();
                break;
            }
            case 'ampmList': {
                this.timePicker.prevAmPm();
                break;
            }
        }
    }

    /**
     * @hidden
     */
    @HostListener('keydown.arrowdown', ['$event'])
    public onKeydownArrowDown(event: KeyboardEvent) {
        event.preventDefault();

        this.nextItem();
    }

    /**
     * @hidden
     */
    @HostListener('keydown.arrowup', ['$event'])
    public onKeydownArrowUp(event: KeyboardEvent) {
        event.preventDefault();

        this.prevItem();
    }

    /**
     * @hidden
     */
    @HostListener('keydown.arrowright', ['$event'])
    public onKeydownArrowRight(event: KeyboardEvent) {
        event.preventDefault();

        const listName = (event.target as HTMLElement).className;

        if (listName.indexOf('hourList') !== -1 && this.timePicker.minuteList) {
            this.timePicker.minuteList.nativeElement.focus();
        } else if ((listName.indexOf('hourList') !== -1 || listName.indexOf('minuteList') !== -1) && this.timePicker.ampmList) {
            this.timePicker.ampmList.nativeElement.focus();
        }
    }

    /**
     * @hidden
     */
    @HostListener('keydown.arrowleft', ['$event'])
    public onKeydownArrowLeft(event: KeyboardEvent) {
        event.preventDefault();

        const listName = (event.target as HTMLElement).className;

        if (listName.indexOf('ampmList') !== -1 && this.timePicker.minuteList) {
            this.timePicker.minuteList.nativeElement.focus();
        } else if ((listName.indexOf('ampmList') !== -1 || listName.indexOf('minuteList') !== -1) && this.timePicker.hourList) {
            this.timePicker.hourList.nativeElement.focus();
        }
    }

    /**
     * @hidden
     */
    @HostListener('keydown.enter', ['$event'])
    public onKeydownEnter(event: KeyboardEvent) {
        event.preventDefault();

        if (this.timePicker.mode === InteractionMode.DropDown) {
            this.timePicker.close();
            return;
        }
        this.timePicker.okButtonClick();
    }

    /**
     * @hidden
     */
    @HostListener('keydown.escape', ['$event'])
    public onKeydownEscape(event: KeyboardEvent) {
        event.preventDefault();

        this.timePicker.cancelButtonClick();
    }

    /**
     * @hidden
     */
    @HostListener('mouseover')
    public onHover() {
        this.elementRef.nativeElement.focus();
    }

    /**
     * @hidden
     */
    @HostListener('wheel', ['$event'])
    public onScroll(event) {
        event.preventDefault();
        event.stopPropagation();

        if (event.deltaY > 0) {
            this.nextItem();
        } else if (event.deltaY < 0) {
            this.prevItem();
        }
    }

    /**
     * @hidden
     */
    @HostListener('panmove', ['$event'])
    public onPanMove(event) {
        this.sumDeltaY += event.deltaY - this.lastDeltaY;
        this.lastDeltaY = event.deltaY;

        if (this.sumDeltaY >= this.stepSize) {
            this.sumDeltaY -= this.stepSize;
            this.prevItem();
        } else if (this.sumDeltaY <= -this.stepSize) {
            this.sumDeltaY += this.stepSize;
            this.nextItem();
        }
    }

    @HostListener('mouseup', ['$event'])
    @HostListener('mousedown', ['$event'])
    public onMouse(event) {
        this.sumDeltaY = 0;
        this.lastDeltaY = 0;
    }

    @HostListener('document:touchstart', ['$event'])
    @HostListener('document:touchend', ['$event'])
    public onTouch(event) {
        this.sumDeltaY = 0;
        this.lastDeltaY = 0;
    }
}

/**
 * @hidden
 */
@Directive({
    selector: '[igxHourItem]'
})
export class IgxHourItemDirective {

    @Input('igxHourItem')
    public value: string;

    @HostBinding('class.igx-time-picker__item')
    get defaultCSS(): boolean {
        return true;
    }

    @HostBinding('class.igx-time-picker__item--selected')
    get selectedCSS(): boolean {
        return this.isSelectedHour;
    }

    @HostBinding('class.igx-time-picker__item--active')
    get activeCSS(): boolean {
        return this.isSelectedHour && this.itemList.isActive;
    }

    get isSelectedHour(): boolean {
        return this.timePicker.selectedHour === this.value;
    }

    constructor(@Inject(IGX_TIME_PICKER_COMPONENT)
    public timePicker: IgxTimePickerBase,
        private itemList: IgxItemListDirective) { }

    @HostListener('click', ['value'])
    public onClick(item) {
        if (item !== '') {
            this.timePicker.scrollHourIntoView(item);
        }
    }
}

/**
 * @hidden
 */
@Directive({
    selector: '[igxMinuteItem]'
})
export class IgxMinuteItemDirective {

    @Input('igxMinuteItem')
    public value: string;

    @HostBinding('class.igx-time-picker__item')
    get defaultCSS(): boolean {
        return true;
    }

    @HostBinding('class.igx-time-picker__item--selected')
    get selectedCSS(): boolean {
        return this.isSelectedMinute;
    }

    @HostBinding('class.igx-time-picker__item--active')
    get activeCSS(): boolean {
        return this.isSelectedMinute && this.itemList.isActive;
    }

    get isSelectedMinute(): boolean {
        return this.timePicker.selectedMinute === this.value;
    }

    constructor(@Inject(IGX_TIME_PICKER_COMPONENT)
    public timePicker: IgxTimePickerBase,
        private itemList: IgxItemListDirective) { }

    @HostListener('click', ['value'])
    public onClick(item) {
        if (item !== '') {
            this.timePicker.scrollMinuteIntoView(item);
        }
    }
}

/**
 * @hidden
 */
@Directive({
    selector: '[igxAmPmItem]'
})
export class IgxAmPmItemDirective {

    @Input('igxAmPmItem')
    public value: string;

    @HostBinding('class.igx-time-picker__item')
    get defaultCSS(): boolean {
        return true;
    }

    @HostBinding('class.igx-time-picker__item--selected')
    get selectedCSS(): boolean {
        return this.isSelectedAmPm;
    }

    @HostBinding('class.igx-time-picker__item--active')
    get activeCSS(): boolean {
        return this.isSelectedAmPm && this.itemList.isActive;
    }

    get isSelectedAmPm(): boolean {
        return this.timePicker.selectedAmPm === this.value;
    }

    constructor(@Inject(IGX_TIME_PICKER_COMPONENT)
    public timePicker: IgxTimePickerBase,
        private itemList: IgxItemListDirective) { }

    @HostListener('click', ['value'])
    public onClick(item) {
        if (item !== '') {
            this.timePicker.scrollAmPmIntoView(item);
        }
    }
}

/**
 * This directive should be used to mark which ng-template will be used from IgxTimePicker when re-templating its input group.
 */
@Directive({
    selector: '[igxTimePickerTemplate]'
})
export class IgxTimePickerTemplateDirective {
    constructor(public template: TemplateRef<any>) { }
}

/**
 * This directive can be used to add custom action buttons to the dropdownb/dialog.
 */
@Directive({
    selector: '[igxTimePickerActions]'
})
export class IgxTimePickerActionsDirective {
    constructor(public template: TemplateRef<any>) { }
}
