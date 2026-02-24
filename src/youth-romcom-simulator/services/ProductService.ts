import { ref } from 'vue';

// 确保全局API在编译时可用
declare const TavernHelper: any;

export interface Product {
  id: string;
  名称: string;
  价格: number;
  分类: string;
  上架时间: number[];
  生效时间: number;
  耐久度?: number;
  库存: number;
  最大库存: number;
  补货周期: number;
  送货时间: string;
  描述: string;
  效果?: string;
}

class ProductService {
  private static instance: ProductService;
  public products = ref<Product[]>([]);
  public productMap = ref<Map<string, Product>>(new Map());
  private loadingPromise: Promise<void>;

  private constructor() {
    this.loadingPromise = this.loadProducts();
  }

  public ensureLoaded(): Promise<void> {
    return this.loadingPromise;
  }

  public static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  private async loadProducts() {
    try {
      const bookName = '天华校园';
      const entryKey = '[世界观]商品列表';
      const entries = await TavernHelper.getLorebookEntries(bookName);
      const productEntry = entries.find((e: any) => e.keys.includes(entryKey));

      if (!productEntry || !productEntry.content) {
        console.error(`无法在世界书 "${bookName}" 中找到商品列表条目 (key: ${entryKey})`);
        return;
      }
      this.parseProducts(productEntry.content);
    } catch (error) {
      console.error('加载或解析商品列表失败:', error);
    }
  }

  private parseProducts(content: string) {
    const productsArray: Product[] = [];
    const productMap = new Map<string, Product>();

    const entries = content.split('ID|').slice(1);
    entries.forEach(entryText => {
      const lines = entryText.trim().split('\n');
      const product: Partial<Product> = {};

      product.id = lines[0].trim();

      lines.slice(1).forEach(line => {
        const [key, ...valueParts] = line.split('|');
        const value = valueParts.join('|').trim();

        switch (key.trim()) {
          case '名称':
            product.名称 = value;
            break;
          case '价格':
            product.价格 = parseInt(value, 10);
            break;
          case '分类':
            product.分类 = value;
            break;
          case '上架时间':
            product.上架时间 = value.split(',').map(Number);
            break;
          case '生效时间':
            product.生效时间 = parseInt(value, 10);
            break;
          case '耐久度':
            product.耐久度 = parseInt(value, 10);
            break;
          case '库存':
            product.库存 = parseInt(value, 10);
            break;
          case '最大库存':
            product.最大库存 = parseInt(value, 10);
            break;
          case '补货周期':
            product.补货周期 = parseInt(value, 10);
            break;
          case '送货时间':
            product.送货时间 = value;
            break;
          case '描述':
            product.描述 = value;
            break;
          case '效果':
            product.效果 = value;
            break;
        }
      });

      if (this.isProduct(product)) {
        productsArray.push(product);
        productMap.set(product.id, product);
      }
    });

    this.products.value = productsArray;
    this.productMap.value = productMap;
  }

  private isProduct(obj: any): obj is Product {
    return (
      obj &&
      typeof obj.id === 'string' &&
      typeof obj.名称 === 'string' &&
      typeof obj.价格 === 'number' &&
      typeof obj.分类 === 'string'
    );
  }

  public getProductById(id: string): Product | undefined {
    return this.productMap.value.get(id);
  }

  public getProductNameById(id: string): string {
    return this.getProductById(id)?.名称 || id;
  }
}

export const productService = ProductService.getInstance();

export async function getProducts(): Promise<Product[]> {
  await productService.ensureLoaded();
  return productService.products.value;
}
