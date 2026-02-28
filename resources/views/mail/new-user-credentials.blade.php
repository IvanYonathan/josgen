@component('mail::message')
# Welcome to JosGen, {{ $user->name }}!

An account has been created for you on **JosGen**. Below are your login credentials:

**Email / Username:** {{ $user->email }}

**Password:** `{{ $plainPassword }}`

@component('mail::button', ['url' => $loginUrl])
Log In to JosGen
@endcomponent

> **Important:** Please store and remember this password. It is advised to immediately change your password after logging in via **Settings → Reset Password**.

Thank you,
{{ config('app.name') }}
@endcomponent
