import { loadModules } from 'esri-loader';

import IOAuthInfo from 'esri/identity/OAuthInfo';
import IIdentityManager from 'esri/identity/IdentityManager';
import IPortal from 'esri/portal/Portal';
import ICredential from 'esri/identity/Credential';
import IPortalUser from 'esri/portal/PortalUser';
import { saveBrowseAppHashParamsToLocalStorage } from '../url-manager/BrowseAppUrlManager';
import { UserSession } from '@esri/arcgis-rest-auth';

interface Props {
    appId: string;
    portalUrl?: string;
};

interface OAuthResponse {
    credential: ICredential;
    portal: IPortal;
};

export default class OAuthUtils {

    private appId: string;
    private portalUrl: string;

    private oauthInfo: IOAuthInfo;
    private esriId: any;
    private userPortal: IPortal;

    constructor(props: Props) {
        this.appId = props.appId;
        this.portalUrl = props.portalUrl || 'https://www.arcgis.com';
    }

    async init(): Promise<OAuthResponse> {
        try {
            type Modules = [
                typeof IOAuthInfo,
                typeof IIdentityManager,
                typeof IPortal
            ];

            const [ OAuthInfo, IdentityManager, Portal ] = await (loadModules([
                'esri/identity/OAuthInfo',
                'esri/identity/IdentityManager',
                'esri/portal/Portal',
            ]) as Promise<Modules>);

            this.oauthInfo = new OAuthInfo({
                appId: this.appId,
                portalUrl: this.portalUrl,
                popup: false,
            });

            IdentityManager.useSignInPage = false;

            IdentityManager.registerOAuthInfos([this.oauthInfo]);

            this.esriId = IdentityManager;

            const credential: ICredential = await this.esriId.checkSignInStatus(
                this.oauthInfo.portalUrl + '/sharing'
            );

            // init paortal
            this.userPortal = new Portal({ url: this.portalUrl });
            // Setting authMode to immediate signs the user in once loaded
            this.userPortal.authMode = 'immediate';

            // Once loaded, user is signed in
            await this.userPortal.load();

            return {
                credential,
                portal: this.userPortal
            };

        } catch (err) {
            console.log('anomynous user');
        }

        return {
            credential: null,
            portal: null
        };
    }

    sigIn() {
        if(window.location.pathname.includes('browse')){
            saveBrowseAppHashParamsToLocalStorage()
        }

        this.esriId
            .getCredential(this.oauthInfo.portalUrl + '/sharing')
            .then((res: ICredential) => {
                console.log('signed in as', res.userId);
            });
    };

    signOut() {
        this.esriId.destroyCredentials();
        window.location.reload();
    };

    // get the user data object to populate Esri Global Nav
    getUserData(){
        if(!this.userPortal){
            return null;
        }

        const { name } = this.userPortal;

        const user:IPortalUser & { 
            favGroupId?: string 
        } = this.userPortal.user;
        
        const { 
            fullName,
            username,
            thumbnailUrl,
            favGroupId
        } = user;

        return {
            // 	name: 'Cassidy Bishop',
            name: fullName,
            // 	id: 'iamoktatester@gmail.com',
            id: username,
            // 	group: 'Riverside City Mgmt.',
            group: name,
            // 	image: '//placehold.it/300x300'
            image: thumbnailUrl,
            favGroupId
        }
    }

    getPortalBaseUrl() {
        if (!this.userPortal) {
            return null;
        }
    
        const { urlKey, url, customBaseUrl } = this.userPortal;
    
        return urlKey ? `https://${urlKey}.${customBaseUrl}` : `${url}`;
    }

    /**
     * Get authentication parameters for REST API calls
     * @returns Object with authentication parameters
     */
    async getAuthParams(): Promise<Record<string, string>> {
        try {
            const { credential } = await this.init();
            
            if (!credential || !credential.token) {
                return { f: 'json' };
            }
            
            return {
                token: credential.token,
                f: 'json'
            };
        } catch (error) {
            console.error('Error getting auth params:', error);
            return { f: 'json' };
        }
    }

    /**
     * Get token string
     * @returns Token string or undefined if not authenticated
     */
    async getToken(): Promise<string | undefined> {
        try {
            const { credential } = await this.init();
            return credential?.token;
        } catch (error) {
            console.error('Error getting token:', error);
            return undefined;
        }
    }

    /**
     * Get authentication session for ArcGIS REST JS
     * @returns UserSession or null if not authenticated
     */
    async getAuthSession(): Promise<UserSession | null> {
        try {
            const { credential } = await this.init();
            
            if (!credential || !credential.token) {
                return null;
            }
            
            return new UserSession({ token: credential.token });
        } catch (error) {
            console.error('Error getting authentication session:', error);
            return null;
        }
    }

    /**
     * Check if user is authenticated
     * @returns Boolean indicating if user is authenticated
     */
    async isAuthenticated(): Promise<boolean> {
        try {
            const { credential } = await this.init();
            return !!credential?.token;
        } catch (error) {
            console.error('Error checking authentication status:', error);
            return false;
        }
    }

    /**
     * Create authenticated axios request config
     * @returns Axios request config with authentication
     */
    async createAuthRequestConfig() {
        const params = await this.getAuthParams();
        
        return {
            params
        };
    }
}
