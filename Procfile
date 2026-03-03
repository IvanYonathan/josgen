web: php artisan migrate --force && php artisan db:seed --force && php artisan queue:work --sleep=3 --tries=3 --max-time=3600 --daemon & php artisan serve --host=0.0.0.0 --port=$PORT
