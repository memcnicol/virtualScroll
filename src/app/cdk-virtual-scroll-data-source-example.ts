import {CollectionViewer, DataSource, ListRange} from '@angular/cdk/collections';
import {ChangeDetectionStrategy, Component, HostListener, NgZone, ViewChild} from '@angular/core';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import { CdkVirtualScrollViewport, ScrollDispatcher } from '@angular/cdk/scrolling';

/** @title Virtual scroll with a custom data source */
@Component({
  selector: 'cdk-virtual-scroll-data-source-example',
  styleUrls: ['cdk-virtual-scroll-data-source-example.css'],
  templateUrl: 'cdk-virtual-scroll-data-source-example.html',
  changeDetection: ChangeDetectionStrategy.Default,
})


export class CdkVirtualScrollDataSourceExample {
  ds = new MyDataSource();

  data: any = 1;
  top: any = 0;
  viewport: any = 0;
  range: any = 0;
  length: any = 1;

  @ViewChild(CdkVirtualScrollViewport) virtualScroll: CdkVirtualScrollViewport;

  constructor(private scrollDispatcher: ScrollDispatcher, private ngZone: NgZone) {}

  ngAfterViewInit(): void {

    this.updateValues();

    this.scrollDispatcher.scrolled().subscribe((event) => {
      console.log('scrolled');
      this.ngZone.run( () => {
        this.updateValues();
      });
    });
  }

  @HostListener('window:resize') onResize() {
    // guard against resize before view is rendered
    console.log("window resized");
    this.updateValues();
  }

  private numberWithCommas(x:number) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  updateValues() {
    this.top = Math.round(this.virtualScroll.measureScrollOffset("top") /50) + 1;
    this.viewport = Math.floor(this.virtualScroll.getViewportSize() /50);
    this.range = this.top + this.viewport - 1;

    this.top = this.numberWithCommas(this.top);
    this.range = this.numberWithCommas(this.range);
    this.data = this.virtualScroll.getRenderedRange();
    this.length = this.numberWithCommas(this.virtualScroll.getDataLength());

  }
}

export class MyDataSource extends DataSource<string | undefined> {
  private _length = 100000;
  private _pageSize = 100;
  private _cachedData = Array.from<string>({length: this._length});
  private _fetchedPages = new Set<number>();
  private readonly _dataStream = new BehaviorSubject<(string | undefined)[]>(this._cachedData);
  private readonly _subscription = new Subscription();

  connect(collectionViewer: CollectionViewer): Observable<(string | undefined)[]> {
    this._subscription.add(
      collectionViewer.viewChange.subscribe(range => {
        const startPage = this._getPageForIndex(range.start);
        const endPage = this._getPageForIndex(range.end - 1);
        for (let i = startPage; i <= endPage; i++) {
          this._fetchPage(i);
        }
      }),
    );
    return this._dataStream;
  }

  disconnect(): void {
    this._subscription.unsubscribe();
  }

  private _getPageForIndex(index: number): number {
    return Math.floor(index / this._pageSize);
  }

  private _fetchPage(page: number) {
    if (this._fetchedPages.has(page)) {
      return;
    }
    this._fetchedPages.add(page);

    // Use `setTimeout` to simulate fetching data from server.
    setTimeout(() => {
      this._cachedData.splice(
        page * this._pageSize,
        this._pageSize,
        ...Array.from({length: this._pageSize}).map((_, i) => `Item #${page * this._pageSize + i + 1}`),
      );
      this._dataStream.next(this._cachedData);
    }, Math.random() * 1000 + 200);
  }
}


/**  Copyright 2021 Google LLC. All Rights Reserved.
    Use of this source code is governed by an MIT-style license that
    can be found in the LICENSE file at https://angular.io/license */