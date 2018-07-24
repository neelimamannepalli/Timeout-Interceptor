import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
  HttpHeaders,
  HttpResponseBase
} from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs/Observable';
import { CookieHandlerService } from '@shared/cookieHandler/cookieHandler.service';

@Injectable()
export class TimeOutInterceptor implements HttpInterceptor {
  constructor(
    public cookieHandlerService: CookieHandlerService
  ) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler):
    Observable<HttpEvent<any>> {

    return next.handle(req)
      .map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          if (event.status === 302) {
            this.cookieHandlerService.removeAll();
            location.reload(true);
          }
        }
        return event;
      })
      .do(event => {
        if (event instanceof HttpResponseBase) {
          const response = event as HttpResponseBase;
          if (response && response.ok && response.url && response.url.toLowerCase().indexOf('/login/smlogin') >= 0) {
            window.location.href = environment.loginUrl;
          }
        }
      })
      .catch((err: HttpErrorResponse) => {
        /* WHATS GOING ON HERE?
         When the siteminder times out and we make an API call from the client,
         the server returns a 302 redirect to the siteminder login page.
         This redirect is handled by the browser and angular dont see it.Hence the above "map" and "do" loops never execute.
         (Browser will subsiquently use the siteminder login url for the api call causing a CORS error.)
         Below code is an attempt to work around this issue. The expectation is that after the time out we get an error response with the provided string.
         https://github.com/angular/angular/issues/15165
        */
        if (err && err.status === 0 && err.message.toLowerCase().indexOf('http failure response for (unknown url)') >= 0) {
          this.cookieHandlerService.removeAll();
          location.reload(true);
          const res = new HttpResponse({
            body: null,
            headers: err.headers,
            status: err.status,
            statusText: err.statusText,
            url: err.url
          });
          return Observable.of(res);
        } else {
          return Observable.throw(err);
        }
      });
  }
}
