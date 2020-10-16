import { share, map, filter, take } from 'rxjs/operators';

export const refSubject = (refsObserver, search) =>
    refsObserver.pipe(
        filter(({ key }) => key === search),
        map(({ value }) => value),
        share(),
    );

export const refPromise = observer =>
    observer.pipe(filter(Boolean), take(1)).toPromise();
