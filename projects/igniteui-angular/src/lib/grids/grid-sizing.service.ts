import { Injectable } from '@angular/core';
import { IgxGridBaseComponent, FilterMode, FILTER_ROW_HEIGHT } from './grid-base.component';

/** @hidden */
@Injectable()
export class IgxGridSizingService {
    public grid: IgxGridBaseComponent;

    public _height: string;
    public _width: string;
    private _summariesHeight: number;
    private _columnWidthSetByUser: boolean;

    protected _defaultTargetRecordNumber = 10;

    /**
     * @hidden
     */
    protected get isPercentHeight() {
        return this._height && this._height.indexOf('%') !== -1;
    }

    /**
     * @hidden
     */
    protected get rowBasedHeight() {
        return this.grid.dataLength * this.grid.rowHeight;
    }

    /**
     * @hidden
     */
    public get height(): string {
        return this._height;
    }

    /**
     * @hidden
     */
    public set height(value: string) {
        if (this._height !== value) {
            this._height = value;
            requestAnimationFrame(() => {
                if (!this.grid.isDestroyed) {
                    this.calculateGridSizes();
                    this.grid.cdr.markForCheck();
                }
            });
        }
    }

    /**
     * @hidden
     */
    public get width() {
        return this._width;
    }

    /**
     * @hidden
     */
    public set width(value: string) {
        if (this._width !== value) {
            this._width = value;
            requestAnimationFrame(() => {
                // Calling reflow(), because the width calculation
                // might make the horizontal scrollbar appear/disappear.
                // This will change the height, which should be recalculated.
                if (!this.grid.isDestroyed) {
                    this.calculateGridSizes();
                }
            });
        }
    }

    /**
     * @hidden @internal
     */
    public get summariesHeight(): number {
        return this._summariesHeight;
    }

    /**
     * @hidden @internal
     */
    public get columnWidthSetByUser(): boolean {
        return this._columnWidthSetByUser;
    }

     /**
     * @hidden @internal
     */
    public set columnWidthSetByUser(value: boolean) {
        this._columnWidthSetByUser = value;
    }

    /**
     * @hidden
     */
    public calculateGridSizes() {
        /*
            TODO: (R.K.) This layered lasagne should be refactored
            ASAP. The reason I have to reset the caches so many times is because
            after teach `detectChanges` call they are filled with invalid
            state. Of course all of this happens midway through the grid
            sizing process which of course, uses values from the caches, thus resulting
            in a broken layout.
        */
        this.grid.resetCaches();
        const hasScroll = this.grid.hasVerticalSroll();
        this.calculateGridWidth();
        this.grid.cdr.detectChanges();
        this.grid.resetCaches();
        this.calculateGridHeight();

        if (this.grid.showRowCheckboxes) {
            this.grid.calcRowCheckboxWidth = this.grid.headerCheckboxContainer.nativeElement.getBoundingClientRect().width;
        }

        if (this.grid.rowEditable) {
            this.grid.repositionRowEditingOverlay(this.grid.rowInEditMode);
        }

        this.grid.cdr.detectChanges();
        this.grid.resetCaches();
        // in case scrollbar has appeared recalc to size correctly.
        if (hasScroll !== this.grid.hasVerticalSroll()) {
            this.calculateGridWidth();
            this.grid.cdr.detectChanges();
            this.grid.resetCaches();
        }
    }

     /**
     * @hidden
     */
    protected getGroupAreaHeight(): number {
        return 0;
    }

    /**
     * @hidden
     */
    protected getToolbarHeight(): number {
        let toolbarHeight = 0;
        if (this.grid.showToolbar && this.grid.toolbarHtml != null) {
            toolbarHeight = this.grid.toolbarHtml.nativeElement.firstElementChild ?
                this.grid.toolbarHtml.nativeElement.offsetHeight : 0;
        }
        return toolbarHeight;
    }

    /**
     * @hidden
     */
    protected getPagingHeight(): number {
        let pagingHeight = 0;
        if (this.grid.paging && this.grid.paginator) {
            pagingHeight = this.grid.paginator.nativeElement.firstElementChild ?
                this.grid.paginator.nativeElement.offsetHeight : 0;
        }
        return pagingHeight;
    }

    /**
     * @hidden
     */
    protected get defaultTargetBodyHeight(): number {
        const allItems = this.grid.totalItemCount || this.grid.dataLength;
        return this.grid.rowHeight * Math.min(this._defaultTargetRecordNumber,
            this.grid.paging ? Math.min(allItems, this.grid.perPage) : allItems);
    }


    /**
     * @hidden
     * Sets this._height
     */
    public _derivePossibleHeight() {
        // don't derive if not % height
        // or height = null
        // or the grid is still not attached
        // or the data length is 0
        if (!this.isPercentHeight || !this._height || !this.grid.isAttachedToDom || this.rowBasedHeight === 0) {
            return;
        }
        // derive
        // if the parent doesn't have clientHeight
        if (!this.grid.nativeElement.parentNode || !this.grid.nativeElement.parentNode.clientHeight) {
            // get from browser
            const viewPortHeight = document.documentElement.clientHeight;
            this._height = this.rowBasedHeight <= viewPortHeight ? null : viewPortHeight.toString();
        } else {
            // get from parent height ---- this should be removed
            const parentHeight = this.grid.nativeElement.parentNode.getBoundingClientRect().height;
            this._height = this.rowBasedHeight <= parentHeight ? null : this._height;
        }
    }

    /**
     * @hidden
     * Sets columns defaultWidth property
     */
    protected _derivePossibleWidth() {
        if (!this._columnWidthSetByUser) {
            this._columnWidth = this.getPossibleColumnWidth();
            this.columnList.forEach((column: IgxColumnComponent) => {
                column.defaultWidth = this._columnWidth;
            });
            this.resetCachedWidths();
        }
    }

     /**
     * @hidden
     * Sets TBODY height i.e. this.calcHeight
     */
    public calculateGridHeight() {
        this._derivePossibleHeight();
        // TODO: Calculate based on grid density
        if (this.grid.maxLevelHeaderDepth) {
            this.grid.theadRow.nativeElement.style.height = `${(this.grid.maxLevelHeaderDepth + 1) * this.grid.defaultRowHeight +
                (this.grid.allowFiltering && this.grid.filterMode === FilterMode.quickFilter ? FILTER_ROW_HEIGHT : 0) + 1}px`;
        }

        /// DO SUMMARIES MAGIC
        this._summariesHeight = 0;
        if (!this._height) {
            this.grid.calcHeight = null;
            if (this.grid.hasSummarizedColumns && this.grid.rootSummariesEnabled) {
                this._summariesHeight = this.grid.summaryService.calcMaxSummaryHeight();
            }
            return;
        }

        if (this.grid.hasSummarizedColumns && this.grid.rootSummariesEnabled) {
            this._summariesHeight = this.grid.summaryService.calcMaxSummaryHeight();
        }

        /////

        /// FINALLY ASSIGN BODY HEIGHT
        this.grid.calcHeight = this.calculateGridBodyHeight();
    }

    /**
     * @hidden
     */
    public calculateGridBodyHeight() {
        const footerBordersAndScrollbars = this.grid.tfoot.nativeElement.offsetHeight -
            this.grid.tfoot.nativeElement.clientHeight;
        const computed = this.grid.document.defaultView.getComputedStyle(this.grid.nativeElement);
        const toolbarHeight = this.getToolbarHeight();
        const pagingHeight = this.getPagingHeight();
        const groupAreaHeight = this.getGroupAreaHeight();
        let gridHeight;

        if (this.isPercentHeight) {
            /*height in %*/
            if (computed.getPropertyValue('height').indexOf('%') === -1 ) {
                gridHeight = parseInt(computed.getPropertyValue('height'), 10);
            } else {
                return this.defaultTargetBodyHeight;
            }
        } else {
            gridHeight = parseInt(this._height, 10);
        }
        const height = Math.abs(gridHeight - toolbarHeight -
                this.grid.theadRow.nativeElement.offsetHeight -
                this._summariesHeight - pagingHeight -
                groupAreaHeight - footerBordersAndScrollbars -
                this.grid.scr.nativeElement.clientHeight);

        if (height === 0 || isNaN(gridHeight) || this.grid.dataLength === 0) {
            const bodyHeight = this.defaultTargetBodyHeight;
            return bodyHeight > 0 ? bodyHeight : null;
        }

        return height;
    }

     /**
     * @hidden
     * Sets grid width i.e. this.calcWidth
     */
    public calculateGridWidth() {
        let width;
        const computed = this.document.defaultView.getComputedStyle(this.nativeElement);
        const el = this.document.getElementById(this.nativeElement.id);

        if (this.isPercentWidth) {
            /* width in %*/
            width = computed.getPropertyValue('width').indexOf('%') === -1 ?
                parseInt(computed.getPropertyValue('width'), 10) : null;
        } else {
            width = parseInt(this._width, 10);
        }

        if (!width && el) {
            width = el.offsetWidth;
        }


        if (!width) {
            width = this.columnList.reduce((sum, item) =>  sum + parseInt((item.width || item.defaultWidth), 10), 0);
        }

        if (this.hasVerticalSroll()) {
            width -= this.scrollWidth;
        }
        if (Number.isFinite(width) && width !== this.calcWidth) {
            this.calcWidth = width;
            this.cdr.detectChanges();
        }
        this._derivePossibleWidth();
    }
}
