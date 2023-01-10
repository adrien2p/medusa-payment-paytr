import passport from 'passport';
import { ExtractJwt, Strategy as FirebaseStrategy } from 'passport-firebase-jwt';
import { ConfigModule, MedusaContainer } from '@medusajs/medusa/dist/types/global';
import { Router } from 'express';
import { FIREBASE_ADMIN_STRATEGY_NAME, FirebaseAuthOptions, Profile } from './types';
import { PassportStrategy } from '../../core/passport/Strategy';
import { validateAdminCallback } from '../../core/validate-callback';
import { firebaseAuthRoutesBuilder } from '../../core/passport/utils/auth-routes-builder';
import { auth } from 'firebase-admin';

export class FirebaseAdminStrategy extends PassportStrategy(FirebaseStrategy, FIREBASE_ADMIN_STRATEGY_NAME) {
	constructor(
		protected readonly container: MedusaContainer,
		protected readonly configModule: ConfigModule,
		protected readonly strategyOptions: FirebaseAuthOptions
	) {
		super({
			jwtFromRequest: strategyOptions.store.jwtFromRequest ?? ExtractJwt.fromAuthHeaderAsBearerToken()
		});
	}

	async validate(token: string): Promise<null | { id: string }> {
		const decodedToken = await auth().verifyIdToken(token);

		const profile: Profile = { emails: [{ value: decodedToken.email }] };
		return await validateAdminCallback(this)(profile, { strategyErrorIdentifier: 'Firebase' });
	}
}

/**
 * Return the router that hold the google admin authentication routes
 * @param google
 * @param configModule
 */
export function getFirebaseAdminAuthRouter(firebase: FirebaseAuthOptions, configModule: ConfigModule): Router {
	return firebaseAuthRoutesBuilder(
		{
			domain: "admin",
            configModule,
            authPath: firebase.admin.authPath ?? '/admin/auth/firebase',
            successRedirect: firebase.admin.successRedirect,
            failureRedirect: firebase.admin.failureRedirect,
            passportAuthenticateMiddleware: passport.authenticate(FIREBASE_ADMIN_STRATEGY_NAME, {
                session: false,
            }),
			enableRedirects: firebase.admin.enableRedirects ?? true,
		}
	);
}
