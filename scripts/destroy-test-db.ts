const destroyTestDb = async () => {
  await Bun.file("test.sqlite").delete();
  console.log("Test database destroyed");
  
  
};

destroyTestDb();
