# deno-pebbles

Small programs that I wrote to run in Deno, to take care of mundane tasks.

## Usage

Make sure you [have Deno installed](https://deno.land/manual/getting_started/installation).

All programs are included in a task list. List them by running

```shell
deno task
```

Running only the task name without arguments, or passing `--help`, `--h`, or `-h` as an argument will show help for the
program. This includes a version, what arguments are required or defaulted to a certain value, and the Deno permissions
granted when running the program.

```shell
deno task <program-name>
```

```shell
deno task <program-name> --help
```

```shell
deno task <program-name> --h
```

```shell
deno task <program-name> -h
```

## The Programs

See their subfolders for additional info.

- [open-when-live](https://github.com/bachmacintosh/deno-pebbles/blob/main/open-when-live) - A program that opens a
  Twitch stream in your default browser once a given streamer is live.
- [google-oauth](https://github.com/bachmacintosh/deno-pebbles/blob/main/google-oauth) - A program that gets a Refresh
  Token from Google, and stores it in a GitHub Repo's secrets
