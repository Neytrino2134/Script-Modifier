
// Types for Google API global objects
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const CLIENT_ID_KEY = 'settings_googleClientId';
const API_KEY_KEY = 'gemini-api-key'; // Reusing Gemini key for now if applicable, but usually Drive needs its own or Oauth. 
// Note: Google Drive API strictly requires OAuth2 for user data, API Key is only for public data which we aren't using here.
// We will rely on OAuth token.

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const APP_FOLDER_NAME = 'Prompt Modifier Data';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

// Initialization
export const initGoogleDrive = (clientId: string, callback: (inited: boolean) => void) => {
  if (!clientId) {
      console.warn("Google Drive: No Client ID provided.");
      return;
  }

  const gapiLoaded = () => {
    window.gapi.load('client', async () => {
      await window.gapi.client.init({
        discoveryDocs: [DISCOVERY_DOC],
      });
      gapiInited = true;
      checkInit();
    });
  };

  const gisLoaded = () => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: '', // defined later
    });
    gisInited = true;
    checkInit();
  };

  const checkInit = () => {
    if (gapiInited && gisInited) {
      callback(true);
    }
  };

  if (window.gapi) gapiLoaded();
  if (window.google) gisLoaded();
};

export const requestAccessToken = (callback: (token: any) => void) => {
    if (!tokenClient) throw new Error("Google Drive not initialized");
    
    tokenClient.callback = async (resp: any) => {
      if (resp.error !== undefined) {
        throw (resp);
      }
      callback(resp);
    };
  
    if (window.gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when establishing a new session.
      tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      tokenClient.requestAccessToken({prompt: ''});
    }
};

export const getAppFolderId = async (): Promise<string> => {
    const response = await window.gapi.client.drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and name='${APP_FOLDER_NAME}' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive',
    });

    const files = response.result.files;
    if (files && files.length > 0) {
        return files[0].id;
    } else {
        // Create folder
        const createResponse = await window.gapi.client.drive.files.create({
            resource: {
                name: APP_FOLDER_NAME,
                mimeType: 'application/vnd.google-apps.folder',
            },
            fields: 'id',
        });
        return createResponse.result.id;
    }
};

export const saveFileToDrive = async (fileName: string, content: string, folderId: string, existingFileId?: string) => {
    const fileMetadata: any = {
        name: fileName,
        mimeType: 'application/json',
    };
    
    if (folderId && !existingFileId) {
        fileMetadata.parents = [folderId];
    }

    const media = {
        mimeType: 'application/json',
        body: content,
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: 'application/json' }));

    let response;
    
    const accessToken = window.gapi.client.getToken().access_token;

    if (existingFileId) {
         // Update existing
         response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`, {
            method: 'PATCH',
            headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
            body: form
        });
    } else {
        // Create new
        response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
            body: form
        });
    }
    
    return await response.json();
};

export const listFilesInAppFolder = async (folderId: string) => {
    const response = await window.gapi.client.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, modifiedTime)',
        spaces: 'drive',
    });
    return response.result.files;
};

export const downloadFileContent = async (fileId: string) => {
    const response = await window.gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media',
    });
    return response.body; // GAPI returns raw body for alt=media
};

export const deleteFile = async (fileId: string) => {
    await window.gapi.client.drive.files.delete({
        fileId: fileId
    });
};
