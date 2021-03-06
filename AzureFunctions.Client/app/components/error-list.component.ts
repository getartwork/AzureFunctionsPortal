import {Component} from '@angular/core';
import {BroadcastService} from '../services/broadcast.service';
import {BroadcastEvent} from '../models/broadcast-event'
import {PortalService} from '../services/portal.service';
import {UserService} from '../services/user.service';
import {ErrorItem} from '../models/error-item';
import {ErrorEvent} from '../models/error-event';
import {TranslateService, TranslatePipe} from 'ng2-translate/ng2-translate';
import {PortalResources} from '../models/portal-resources';
import {AiService} from '../services/ai.service';
import {Observable} from 'rxjs/Rx';

@Component({
    selector: 'error-list',
    templateUrl: 'templates/error-list.component.html',
    styleUrls: ['styles/error-list.style.css']
})
export class ErrorListComponent {
    public errorList: ErrorItem[];
    // TODO: _portalService is used in the view to get sessionId. Change this when sessionId is observable.
    constructor(private _broadcastService: BroadcastService,
        public _portalService: PortalService,
        private _translateService: TranslateService,
        private _aiService: AiService) {
        this.errorList = [];
        _broadcastService.subscribe<ErrorEvent>(BroadcastEvent.Error, (error) => {
            var errorItem: ErrorItem;

            if (error && error.message && !error.message.startsWith('<!DOC')) {
                errorItem = { message: error.message, dateTime: new Date().toISOString(), date: new Date() };
                this._aiService.trackEvent('/errors/portal', {error: error.details, message: error.message, displayedGeneric: false.toString()});
                if (!this.errorList.find(e => e.message === errorItem.message)) {
                    this.errorList.push(errorItem);
                }
            } else {
                errorItem = this.getGenericError();
                if (error) {
                    this._aiService.trackEvent('/errors/portal', {error: error.details, displayedGeneric: true.toString()});
                } else {
                    this._aiService.trackEvent('/errors/portal', {error: 'no error info', displayedGeneric: true.toString()});
                }
            }
        });

        Observable.timer(1, 60000)
            .subscribe(_ => {
                let cutOffTime = new Date();
                cutOffTime.setMinutes(cutOffTime.getMinutes() - 10);
                this.errorList = this.errorList.filter(e => e.date > cutOffTime);
            });
    }

    private getGenericError(): ErrorItem {
        return {
            message: this._translateService.instant(PortalResources.errorList_youMay),
            href: 'http://go.microsoft.com/fwlink/?LinkId=780719',
            hrefText: this._translateService.instant(PortalResources.errorList_here),
            dateTime: new Date().toISOString(),
            date: new Date()
        };
    }

    dismissError(index: number) {
        this.errorList.splice(index, 1);
    }
}