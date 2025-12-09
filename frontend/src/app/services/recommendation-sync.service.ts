import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecommendationSyncService {
  // Observable for recommendation updates
  private recommendationAdded = new Subject<void>();
  
  // Observable stream
  public recommendationAdded$ = this.recommendationAdded.asObservable();

  constructor() {}

  // Notify that a recommendation was added
  notifyRecommendationAdded(): void {
    this.recommendationAdded.next();
  }
}
