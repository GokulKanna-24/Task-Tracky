import { backupService } from "./backup.service";

const TOKEN_KEY = "tasktracky.gdrive_access_token";
const TOKEN_EXPIRE_KEY = "tasktracky.gdrive_token_expires_at";
const CLIENT_ID_KEY = "tasktracky.gdrive_client_id";
const LAST_SYNCED_KEY = "tasktracky.gdrive_last_synced_at";
const FILE_NAME = "task-tracky-data.json";
const DEFAULT_CLIENT_ID = "641569052350-lqqmu39ai1pv5o2gd894pp5t4652p7vl.apps.googleusercontent.com";

export type SyncStatus = "idle" | "syncing" | "success" | "error";

export interface SyncState {
  isConnected: boolean;
  status: SyncStatus;
  lastSyncedAt: number | null;
  lastError: string | null;
  clientId: string;
}

type SyncStateListener = (state: SyncState) => void;

class DriveSyncEngine {
  private listeners: Set<SyncStateListener> = new Set();
  private state: SyncState = {
    isConnected: false,
    status: "idle",
    lastSyncedAt: null,
    lastError: null,
    clientId: "",
  };

  constructor() {
    this.initFromStorage();
  }

  private initFromStorage() {
    const token = this.getAccessToken();
    const clientId = this.getClientId();
    const lastSynced = localStorage.getItem(LAST_SYNCED_KEY);

    this.state = {
      isConnected: Boolean(token),
      status: "idle",
      lastSyncedAt: lastSynced ? parseInt(lastSynced, 10) : null,
      lastError: null,
      clientId: clientId || (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID,
    };
  }

  public subscribe(listener: SyncStateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.state));
  }

  public getState(): SyncState {
    return { ...this.state };
  }

  public setClientId(clientId: string) {
    const cleanId = clientId.trim();
    localStorage.setItem(CLIENT_ID_KEY, cleanId);
    this.state.clientId = cleanId;
    this.notify();
  }

  public getClientId(): string {
    const raw = localStorage.getItem(CLIENT_ID_KEY) || (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;
    return raw.trim();
  }

  public getAccessToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiresAt = localStorage.getItem(TOKEN_EXPIRE_KEY);

    if (!token) return null;
    if (expiresAt && Date.now() >= parseInt(expiresAt, 10)) {
      this.clearToken();
      return null;
    }
    return token;
  }

  public setAccessToken(token: string, expiresInSeconds: number = 3600) {
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRE_KEY, expiresAt.toString());
    this.state.isConnected = true;
    this.state.lastError = null;
    this.notify();
  }

  public clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRE_KEY);
    this.state.isConnected = false;
    this.notify();
  }

  public async authorizeWithOAuth(): Promise<string> {
    const clientId = this.getClientId();
    if (!clientId) {
      throw new Error("Google OAuth Client ID is missing. Please enter your Client ID in Settings.");
    }

    return new Promise((resolve, reject) => {
      // Use Google GIS Token Client if available
      if (typeof window !== "undefined" && (window as any).google?.accounts?.oauth2) {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "https://www.googleapis.com/auth/drive.file",
          callback: (response: any) => {
            if (response.error) {
              reject(new Error(response.error_description || response.error));
              return;
            }
            if (response.access_token) {
              this.setAccessToken(response.access_token, response.expires_in);
              resolve(response.access_token);
            } else {
              reject(new Error("No access token returned from Google"));
            }
          },
        });
        client.requestAccessToken();
      } else {
        // Fallback popup window implicit OAuth flow
        const redirectUri = window.location.origin;
        const scope = encodeURIComponent("https://www.googleapis.com/auth/drive.file");
        const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
          clientId
        )}&redirect_uri=${encodeURIComponent(
          redirectUri
        )}&response_type=token&scope=${scope}&prompt=consent`;

        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
          url,
          "GoogleDriveAuth",
          `width=${width},height=${height},left=${left},top=${top}`
        );

        const checkPopup = setInterval(() => {
          if (!popup || popup.closed) {
            clearInterval(checkPopup);
            const token = this.getAccessToken();
            if (token) {
              resolve(token);
            } else {
              reject(new Error("Authorization popup closed before completion"));
            }
          } else {
            try {
              if (popup.location.href.includes("access_token")) {
                const hash = popup.location.hash.substring(1);
                const params = new URLSearchParams(hash);
                const token = params.get("access_token");
                const expiresIn = params.get("expires_in");
                if (token) {
                  this.setAccessToken(token, expiresIn ? parseInt(expiresIn, 10) : 3600);
                  popup.close();
                  clearInterval(checkPopup);
                  resolve(token);
                }
              }
            } catch (e) {
              // Cross-origin error expected while user interacts on Google domain
            }
          }
        }, 500);
      }
    });
  }

  private async getValidToken(): Promise<string> {
    const existing = this.getAccessToken();
    if (existing) return existing;
    return await this.authorizeWithOAuth();
  }

  public async findBackupFile(token: string): Promise<string | null> {
    const q = encodeURIComponent(`name='${FILE_NAME}' and trashed=false`);
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime)`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      if (res.status === 401) {
        this.clearToken();
        throw new Error("Authentication token expired. Please re-connect to Google Drive.");
      }
      throw new Error(`Google Drive search failed: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  }

  /**
   * Downloads fresh task-tracky-data.json from Google Drive and restores into local Dexie IndexedDB
   */
  public async fetchAndRestoreFromDrive(): Promise<boolean> {
    this.state.status = "syncing";
    this.state.lastError = null;
    this.notify();

    try {
      const token = this.getAccessToken();
      if (!token) {
        this.state.status = "idle";
        this.notify();
        return false;
      }

      const fileId = await this.findBackupFile(token);
      if (!fileId) {
        this.state.status = "idle";
        this.notify();
        return false;
      }

      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Failed to download backup file: ${res.statusText}`);
      }

      const jsonText = await res.text();
      await backupService.importBackupJSON(jsonText);

      const ts = Date.now();
      localStorage.setItem(LAST_SYNCED_KEY, ts.toString());
      this.state.status = "success";
      this.state.lastSyncedAt = ts;
      this.notify();
      return true;
    } catch (err: any) {
      this.state.status = "error";
      this.state.lastError = err.message || "Failed to fetch from Google Drive";
      this.notify();
      throw err;
    }
  }

  /**
   * Uploads current local Dexie IndexedDB payload to Google Drive (replaces task-tracky-data.json)
   */
  public async uploadToDrive(): Promise<void> {
    this.state.status = "syncing";
    this.state.lastError = null;
    this.notify();

    try {
      const token = await this.getValidToken();
      const jsonContent = await backupService.exportBackupJSON();
      const fileId = await this.findBackupFile(token);

      const metadata = {
        name: FILE_NAME,
        mimeType: "application/json",
      };

      const boundary = "-------314159265358979323846";
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const multipartRequestBody =
        delimiter +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify(metadata) +
        delimiter +
        "Content-Type: application/json\r\n\r\n" +
        jsonContent +
        close_delim;

      let url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
      let method = "POST";

      if (fileId) {
        url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
        method = "PATCH";
      }

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": `multipart/related; boundary="${boundary}"`,
        },
        body: multipartRequestBody,
      });

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
      }

      const ts = Date.now();
      localStorage.setItem(LAST_SYNCED_KEY, ts.toString());
      this.state.status = "success";
      this.state.lastSyncedAt = ts;
      this.notify();
    } catch (err: any) {
      this.state.status = "error";
      this.state.lastError = err.message || "Failed to upload to Google Drive";
      this.notify();
      throw err;
    }
  }
}

export const driveSyncEngine = new DriveSyncEngine();
