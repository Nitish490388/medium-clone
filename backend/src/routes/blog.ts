import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";
import { createBlogInput, updateBlogInput } from "@nitish2002/medium";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  },
  Variables: {
    userId: string
  }
}>();


blogRouter.use('/*', async (c, next) => {
  const authHeader = c.req.header("authorization") || "";

  const user = await verify(authHeader, c.env.JWT_SECRET);
  if (user) {
    c.set("jwtPayload", user.id);
    await next()
  }
  else {
    c.status(403);
    return c.json({
      message: "You are not logged in"
    })
  }
})

//
//
// CREATE POST _______________________________________
//
// 

blogRouter.post("/create", async (c) => {
  const userId = c.get('jwtPayload');

  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const { success } = createBlogInput.safeParse(body);
  if (!success) {
    c.status(400);
    return c.json({ error: "invalid input" });
  }

  const post = await prisma.post.create({
    data: {
      title: body.title,
      content: body.content,
      authorId: userId
    }
  });
  console.log(post);

  return c.json({
    id: post.id
  });
});

//
//
// UPDATE POST _______________________________________
//
// 

blogRouter.put("/update", async (c) => {

  const userId = c.get('jwtPayload');
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const { success } = updateBlogInput.safeParse(body);
  if (!success) {
    c.status(400);
    return c.json({ error: "invalid input" });
  }

  const post = await prisma.post.update({
    where: {
      id: body.id,
      authorId: userId
    },
    data: {
      title: body.title,
      content: body.content
    }
  });

  return c.json({
    post
  });
})

// 
// 
// BULK POST _______________________________________
// 
// 

blogRouter.get("/bulk", async (c) => {

  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const post = await prisma.post.findMany();

  return c.json(post);
})

//
//
// GET BY ID POST _______________________________________
//
// 

blogRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  console.log(id);

  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const post = await prisma.post.findUnique({
    where: {
      id
    }
  });

  console.log(post);

  return c.json({
    post
  });
})


