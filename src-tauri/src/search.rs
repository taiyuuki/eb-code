use grep::{regex, searcher};
use std::error::Error;

pub fn find() -> Result<(), Box<dyn Error>> {
    let f = std::fs::File::open("test.txt")?;

    let pattern = "Some(.+?)";
    let matcher = regex::RegexMatcher::new(pattern)?;
    searcher::Searcher::new().search_file(
        &matcher,
        &f,
        searcher::sinks::UTF8(|lnum, line| {
            print!("{}:{}", lnum, line);
            Ok(true)
        }),
    )?;
    Ok(())
}
