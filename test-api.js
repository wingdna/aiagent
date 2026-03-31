async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/categories');
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Content-Type:', res.headers.get('content-type'));
    console.log('Body:', text.substring(0, 200));
  } catch (e) {
    console.error(e);
  }
}

test();
