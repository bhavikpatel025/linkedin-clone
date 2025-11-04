import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SearchResult {
  users: any[];
  posts: any[];
  totalResults: number;
  page: number;
  totalPages: number;
}

export interface SearchResponse {
  success: boolean;
  message: string;
  data: SearchResult;
  errors: string[];
}

export interface SuggestionResponse {
  success: boolean;
  message: string;
  data: any[];
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private apiUrl = 'https://localhost:7068/api/search';

  constructor(private http: HttpClient) { }

  // Main search method with context
  search(query: string, currentUserId: number, searchContext: string = 'home'): Observable<SearchResponse> {
    const params = new HttpParams()
      .set('query', query)
      .set('currentUserId', currentUserId.toString())
      .set('searchContext', searchContext);
    
    return this.http.get<SearchResponse>(this.apiUrl, { params });
  }

  // Get search suggestions with context
  getSuggestions(query: string, searchContext: string = 'home', currentUserId: number = 0): Observable<SuggestionResponse> {
    const params = new HttpParams()
      .set('query', query)
      .set('searchContext', searchContext)
      .set('currentUserId', currentUserId.toString());
    
    return this.http.get<SuggestionResponse>(`${this.apiUrl}/suggestions`, { params });
  }
}