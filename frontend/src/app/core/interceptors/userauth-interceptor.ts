import { HttpInterceptorFn } from '@angular/common/http';

export const userauthInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};
