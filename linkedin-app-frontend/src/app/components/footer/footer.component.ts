import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="footer">
      <div class="footer-container">
        
        <!-- Main Footer Content -->
        <div class="footer-main">
          <div class="footer-section">
            <!-- Logo -->
            <!-- <div class="footer-logo">
              <div class="logo-container">
                <div class="logo-linked">Linked</div>
                <div class="logo-in-box">in</div>
              </div>
            </div> -->
            
            <!-- Navigation Links -->
            <div class="footer-links-grid">
              
              <!-- General -->
              <div class="footer-link-group">
                <h4 class="link-group-title">General</h4>
                <ul class="link-list">
                  <li><a routerLink="/dashboard" class="footer-link">Home</a></li>
                  <li><a routerLink="/network" class="footer-link">Network</a></li>
                  <li><a routerLink="/jobs" class="footer-link">Jobs</a></li>
                  <li><a routerLink="/notifications" class="footer-link">Notifications</a></li>
                </ul>
              </div>

              <!-- Browse LinkedIn -->
              <div class="footer-link-group">
                <h4 class="link-group-title">Browse LinkedIn</h4>
                <ul class="link-list">
                  <li><a href="#" class="footer-link">Learning</a></li>
                  <li><a href="#" class="footer-link">Salary Insights</a></li>
                  <li><a href="#" class="footer-link">Featured</a></li>
                  <li><a href="#" class="footer-link">Guide</a></li>
                </ul>
              </div>

              <!-- Business Solutions -->
              <div class="footer-link-group">
                <h4 class="link-group-title">Business Solutions</h4>
                <ul class="link-list">
                  <li><a href="#" class="footer-link">Talent</a></li>
                  <li><a href="#" class="footer-link">Marketing</a></li>
                  <li><a href="#" class="footer-link">Sales</a></li>
                  <li><a href="#" class="footer-link">Learning</a></li>
                </ul>
              </div>

              <!-- Directories -->
              <div class="footer-link-group">
                <h4 class="link-group-title">Directories</h4>
                <ul class="link-list">
                  <li><a href="#" class="footer-link">Members</a></li>
                  <li><a href="#" class="footer-link">Jobs</a></li>
                  <li><a href="#" class="footer-link">Companies</a></li>
                  <li><a href="#" class="footer-link">Featured</a></li>
                </ul>
              </div>

            </div>
          </div>
        </div>

        <!-- Footer Bottom -->
        <div class="footer-bottom">
          <div class="footer-bottom-content">
            
            <!-- Left Side - Quick Links -->
            <div class="footer-bottom-left">
              <nav class="quick-links">
                <a href="#" class="quick-link">About</a>
                <a href="#" class="quick-link">Accessibility</a>
                <a href="#" class="quick-link">User Agreement</a>
                <a href="#" class="quick-link">Privacy Policy</a>
                <a href="#" class="quick-link">Cookie Policy</a>
                <a href="#" class="quick-link">Copyright Policy</a>
                <a href="#" class="quick-link">Brand Policy</a>
                <a href="#" class="quick-link">Guest Controls</a>
                <a href="#" class="quick-link">Community Guidelines</a>
              </nav>
            </div>

            <!-- Right Side - Language & Copyright -->
            <div class="footer-bottom-right">
              <div class="language-selector">
                <select class="language-dropdown">
                  <option value="en">English (English)</option>
                  <option value="es">Español (Spanish)</option>
                  <option value="fr">Français (French)</option>
                  <option value="de">Deutsch (German)</option>
                  <option value="zh">中文 (Chinese)</option>
                </select>
              </div>
              <div class="copyright">
                LinkedIn Corporation © 2024
              </div>
            </div>

          </div>
        </div>

      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background-color: #f3f2ef;
      border-top: 1px solid #e0e0e0;
      margin-top: auto;
    }

    .footer-container {
      max-width: 1128px;
      margin: 0 auto;
      padding: 0 16px;
    }

    /* Main Footer Section */
    .footer-main {
      padding: 48px 0 32px;
    }

    .footer-section {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    /* Logo */
    .footer-logo {
      margin-bottom: 16px;
    }

    .logo-container {
      display: flex;
      align-items: center;
      line-height: 1;
    }

    .logo-linked {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0a66c2;
      letter-spacing: -0.5px;
      font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .logo-in-box {
      font-size: 1.5rem;
      font-weight: 700;
      color: #ffffff;
      background: #0a66c2;
      padding: 2px 6px;
      border-radius: 3px;
      margin-left: 4px;
      line-height: 1;
    }

    /* Links Grid */
    .footer-links-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 32px;
    }

    .footer-link-group {
      display: flex;
      flex-direction: column;
    }

    .link-group-title {
      font-size: 1rem;
      font-weight: 600;
      color: #000000e6;
      margin-bottom: 16px;
    }

    .link-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .footer-link {
      color: #00000099;
      text-decoration: none;
      font-size: 0.875rem;
      transition: color 0.2s ease;
    }

    .footer-link:hover {
      color: #0a66c2;
      text-decoration: underline;
    }

    /* Footer Bottom */
    .footer-bottom {
      border-top: 1px solid #dce6f2;
      padding: 16px 0;
    }

    .footer-bottom-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    /* Quick Links */
    .quick-links {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
    }

    .quick-link {
      color: #00000099;
      text-decoration: none;
      font-size: 0.75rem;
      transition: color 0.2s ease;
      white-space: nowrap;
    }

    .quick-link:hover {
      color: #0a66c2;
      text-decoration: underline;
    }

    /* Language & Copyright */
    .footer-bottom-right {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .language-dropdown {
      border: 1px solid #dce6f2;
      border-radius: 4px;
      padding: 6px 32px 6px 12px;
      font-size: 0.75rem;
      color: #00000099;
      background: white;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2300000099' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 8px center;
      background-size: 12px;
    }

    .language-dropdown:focus {
      outline: none;
      border-color: #0a66c2;
      box-shadow: 0 0 0 1px #0a66c2;
    }

    .copyright {
      font-size: 0.75rem;
      color: #00000099;
      white-space: nowrap;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .footer-main {
        padding: 32px 0 24px;
      }

      .footer-links-grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 24px;
      }

      .footer-bottom-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .quick-links {
        gap: 12px;
      }

      .footer-bottom-right {
        width: 100%;
        justify-content: space-between;
      }
    }

    @media (max-width: 480px) {
      .footer-container {
        padding: 0 12px;
      }

      .footer-links-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .link-group-title {
        font-size: 0.9rem;
        margin-bottom: 12px;
      }

      .footer-link {
        font-size: 0.8rem;
      }

      .quick-links {
        gap: 8px;
      }

      .quick-link {
        font-size: 0.7rem;
      }

      .language-dropdown {
        font-size: 0.7rem;
        padding: 4px 28px 4px 8px;
      }

      .copyright {
        font-size: 0.7rem;
      }
    }

    /* Dark Mode Support */
    @media (prefers-color-scheme: dark) {
      .footer {
        background-color: #1a1a1a;
        border-top-color: #333;
      }

      .link-group-title {
        color: #ffffff;
      }

      .footer-link {
        color: #ffffff99;
      }

      .footer-bottom {
        border-top-color: #333;
      }

      .quick-link {
        color: #ffffff99;
      }

      .language-dropdown {
        background-color: #2d2d2d;
        border-color: #444;
        color: #ffffff99;
      }

      .copyright {
        color: #ffffff99;
      }
    }
  `]
})
export class FooterComponent {}