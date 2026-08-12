# hrod-plus 后端编码准则

> 适用 hrod-plus 全仓后端 Java 代码。新增/修改代码必须遵守,存量违规按重构方案分批治理。
> **整合来源**:小米集团 Java 语言编码规范(V1.0,公司内部正式)为主体 + 阿里 Java 开发手册(嵩山/黄山版) + Google Java Style Guide + 项目 AGENTS.md 分层/命名基线 + 本仓代码质量决策。
> **术语**:`必须`(强制)/`禁止`(不可)/`建议`(推荐)/`避免`(尽量不)。正反例用 **正例**/**反例**。
> 本着"代码是给人看的"——可读性优先。以后不再违反。
> 跨会话记忆:pointer memory `position-code-quality-rules` 指向本文件。

分层核查的六个边界名称固定为：**API、Application、Domain、Infra、Repository、Common**。

## 一、命名规约

1. `必须` 类/接口/枚举用 `UpperCamelCase`;方法/变量/参数用 `lowerCamelCase`;常量用 `UPPER_WITH_UNDERSCORE`;包名全小写不放下划线/数字开头。
2. `必须` 禁拼音命名(anniu/fapiao);公司/地名例外(xiaomi/beijing)。禁非常规缩写(`AbstractClass→AbsClass`);通用缩写可(Func/IO/Tcp/Xml)。
3. `建议` 抽象类 `Abstract`/`Base` 前缀;异常类 `Exception` 后缀;测试类 `Test` 后缀;Service/DAO 实现类 `Impl` 后缀(`UserServiceImpl` 实现 `UserService`)。
4. `建议` 方法用动词短语:获取单个 `get` 前缀、多个 `list` 前缀(复数结尾 `listObjects`)、统计 `count`、插入 `insert`/`save`、删除 `remove`/`delete`、修改 `update`。明确动作语义,禁 `doSomething`/`process`/`handle` 模糊命名。
5. `建议` 命名体现意图不体现类型(区别于阿里):**正例** `readTimeoutMillis`/`expiredAt`(时间点)/`expiredIn`(区间)/`names`;**反例** `oneSecond`(值会变)/`expiredTime`(歧义)/`nameList`(类型可能重构)。
6. `避免` 枚举类加 `Enum` 后缀(区别于阿里:实现决策不该入类名,enum 可能演变为 interface);布尔变量避免 `is` 前缀(阿里:反例 `isDeleted`→正例 `deleted`)。
7. `必须` 项目命名基线(AGENTS.md §8):接口 `*Provider`/`*Repository`,实现 `*Impl`;DO `*DO`;API `*VO`/`*Dto`/`*Req`;API 转换器 `*Convertor`,Infra 转换器 `*Converter`。
8. `避免` 下划线/美元符作命名起止(`_name`/`$name`/`name_`);例外:库代码必要理由时、测试方法可用下划线(`testFeatureA_InputB`)、与外部 json 格式一致时。

## 二、方法与参数

9. `必须` 方法入参≤5:Controller/Service/Repository 端口方法入参最多 5 个,超过必须抽成对象(Command/Query/Param)+ converter 转换(req→dto/param/query)。命令用 Command,富过滤查询用 Query,简单关联查询(≤5 参)可散参。**反例** 9 参 `search(keyword,...,pageSize)` → 抽 `PositionListQuery`。
10. `必须` 分页抽 `BaseReq` 基类(common 层):查询 Req extends BaseReq,pageNum/pageSize + JSR303 校验 + 归一化方法收敛到基类,消除 Controller 重复 helper。max 场景化(列表 200、选择器 50)。
11. `必须` 排序抽枚举(模块专用,放 domain 层 `domain/enums/{module}/`):不同列表排序字段不同不跨模块通用化。Convertor 做 String→枚举转换,非法值降级默认排序。
12. `建议` 方法体≤80 行,超长拆 helper;超 100 行慎重考虑。一半以上方法应<50 行。Service 不得堆重复 private 过程方法,新增 private 前判断是否应是领域行为(AGENTS.md §3)。
13. `建议` 嵌套≤3 层,超 3 层 if-else 用卫语句先 return、策略/状态模式。**正例** 卫语句:每个条件不满足即 return,主干逻辑清晰。
14. `建议` 返回集合不 null(无元素返 `Collections.emptyList()`);Optional 表示可能缺失的单值,不滥用。

## 三、排版格式

15. `必须` 单行≤150 字符(硬限);120 字符以内优先,超 120 但阅读自然且≤150 可不拆(如整齐的方法签名 `queryIncumbents(@CurrentUser User user, @Valid @RequestBody IncumbentQueryReq req)`)。例外:import、自动生成代码、长 URL。需断行时在运算符/逗号后断行;链式调用点号 `.` 前断行;赋值 `=` 后断行;lambda 箭头 `->` 后断行(非代码块时)。
16. `必须` 缩进 4 空格,禁 Tab;自动换行的参数/调用缩进 +8 空格以区别(不强制与首参对齐)。**正例** 链式 `.append(a).append(b)` 换行点号在前。
17. `必须` K&R 花括号:左括号不换行,右括号独占一行;`if/else/for/while/do` 单行也必须用花括号(阿里/Google 一致)。
18. `必须` 一行一语句,禁一行多语句;一行一变量声明(`int a, b;` 禁,for 循环例外)。
19. `必须` 保留字与括号间空格(`if (`);括号内侧不加空格;二目/三目运算符两边加空格(`=`/`&&`/`+` 等);参数逗号后加空格;`//`/`/*` 后加空格。
20. `禁止` 一参一行换多行:多参方法参数合理紧凑排列(规则 9 对象化后自然消除 9 参换 9 行)。**能一行放下的不要换行**——方法签名/调用/return 语句≤150 字符(规则 15)且阅读自然时保持一行,禁止为"美观"把短调用拆多行(如 `service.queryIncumbents(req.getPositionCode(), req.getPageNum(), req.getPageSize())` 应一行,禁换 3 行)。链式 setter 多个短调用可合并到一行(每行≤150),禁每行一个 `.setXxx`。
21. `必须` 文件 UTF-8 编码,Unix 换行符(非 Windows);一个文件一个顶级类,文件名与类名大小写一致;import 按 ASCII 排序,禁通配符 import,static 与非 static 间空行。
22. `建议` 不同逻辑/业务代码间空行分隔提升可读性(不多空行);return 前加空行。
23. `禁止` 逻辑代码中出现全限定类名(FQN):统一先 `import` 再用简单名,含泛型实参、字段、局部变量、方法签名、返回值、注解、`new`/`instanceof`/异常抛出等所有位置。**反例** `Page<com.hrod.plus.hrodplus.application.service.position.DepartmentReference> page`、`throw new com.mi.oa.infra.oaucf.core.exception.BizException(...)`。出现类名冲突时,先排查冲突根因能否消解(如去重复 import、改用更精确的简单名、重命名局部变量);确实无更好解时才允许在该处用全限定名,且需注释说明冲突原因。例外:反射 `Class.forName("全限定名")` 字符串、`@SpringBootApplication(scanBasePackages=...)` 等必须用全限定名字符串的场景。

## 四、OOP 规约

24. `必须` 分层红线(AGENTS.md §2):API 只做协议/校验/转换;Application 只做编排/事务/权限,不调 Mapper/DO;Domain 承载业务规则不依赖基础设施;Infra 隔离 DO/SDK;Repository 只做数据源。DO 不出 Repository/Infra;API 模型不进 Repository;外部 SDK 不进 Domain/Application/API。
25. `必须` 领域职责优先:过滤/排序/校验/标准化/匹配/降级/分组/状态判断优先放领域对象或 Domain support。Controller 不写规则,Mapper 禁 `SELECT *`,UPDATE/DELETE 必须有 WHERE,列表必须分页/限量。
26. `必须` `@Override` 必加(覆写父类,`@Deprecated` 父方法除外);`equals`/`hashCode` 同时重写;自定义对象作 Map key 必重写两者。
27. `必须` 集合参数/返回用接口类型(`List`/`Set`/`Map`/`ConcurrentMap`),不用具体类型(`ArrayList`/`HashSet`);成员/局部变量同理。数组 Java 风格 `int[] nums` 非 `String strings[]`。
28. `建议` 静态成员用类名访问不用实例(`ClassName.member` 非 `object.staticMethod()`);工具类无 public/default 构造;不需修改的变量考虑 final;内部用 private,继承用 protected。
29. `建议` 包装类 vs 原始类型:Req/VO 字段用包装类(Integer/Long,可 null 表未赋值);领域 Query 内部可用原始类型(有默认值)。POJO 不用原始类型默认值掩盖未赋值。BigDecimal 比较用 `compareTo` 非 `equals`;浮点数比较用 `Math.abs` 或 `BigDecimal.compareTo`。

## 五、集合与并发

30. `必须` 集合返回不 null(无元素返 `Collections.emptyList()`);批量优先,循环内不逐条查 DB,收集 ID 批量查后内存组装(消除 N+1)。
31. `建议` `ArrayList`/`HashMap` 指定初始容量(`new ArrayList<>(expectedSize)`)避免扩容;Map 遍历用 `entrySet` 不用 `keySet`+`get`(双次循环);`CollectionUtils.isEmpty()` 判空避免 null&&size==0。
32. `必须` 线程资源通过线程池提供,禁显式创建线程;线程池用 `ThreadPoolExecutor` + 拒绝策略,禁 `Executors` 创建(防 OOM)。`SimpleDateFormat` 非线程安全,用 `ThreadLocal` 隔离或 `DateTimeFormatter`。并发 Map 用 `ConcurrentHashMap`(HashMap 并发扩容死循环)。
33. `必须` `@Transactional` 标注事务边界与 rollbackFor;只读查询标 `readOnly=true`;事务代码异常必须显式抛出或捕获,避免 Spring 默认回滚策略意外提交。`synchronized` 锁粒度尽量小;`volatile` 仅保证可见性不用于复合操作原子性(`i++`)。

## 六、控制语句与异常

34. `必须` `switch` 必须有 `default`(穷举 enum 例外);每个 `case` 必须 `break`/`return`/`continue`,多 case 共用逻辑加 `// fall through` 注释。
35. `必须` 字符串比较用 `equals` 不用 `==`/`!=`;不确定 null 用 `常量.equals(x)` 或 `Objects.equals(a,b)`。正向逻辑表达(`if (x < 628)` 非 `if (!(x >= 628))`)。
36. `必须` 处理所有异常分支;不吞异常(catch 后不处理);确信忽略时 catch 段注释说明原因。捕获异常封装时把原始异常作为 cause。禁 `finally` 用 `return`/`throw`/`break`/`continue`。禁抛通用异常(`Exception`/`RuntimeException`/`Throwable`),用 `IllegalArgumentException`/`IllegalStateException` 等。
37. `必须` 异常分类:业务异常 `BizException`/`LegacyException`(带错误码),系统异常 `RuntimeException` 派生。`GlobalExceptionHandler` 统一映射:校验异常(MethodArgumentNotValid/ConstraintViolation/Bind/TypeMismatch/MissingParam/IllegalArgument/Validation/HttpMessageNotReadable/HttpMediaTypeNotSupported)统一 HTTP 400;权限 403;未找到 404;系统 500。handler 必须设 `response.setStatus(...)` 与 body code 一致。
38. `必须` 资源对象(`AutoCloseable`/流)用 try-with-resources 关闭。捕获异常记录完整堆栈(`logger.error("msg", e)`),禁仅 `e.printStackTrace()`;禁 `System.out` 打印。
39. `必须` 日志脱敏:禁真实姓名/工号/邮箱/token/连接串(举例 xxx/user-A);异常日志带 `exception.getMessage()` 摘要不打完整 body。错误码统一在 `ApplicationErrorCodeEnum` 定义,码段按模块隔离(position 4099900x 不与 STD_POSITION 4049910x 混用),新增同步 HTTP 映射。

## 七、注释规约

40. `建议` 公开 API 加 Javadoc(public/protected 类/成员/record 组件);自解释签名可省;覆写父类方法可省。类头 Javadoc 说明职责,接口和 Impl 都有。
41. `必须` 核心逻辑必须注释:领域规则/编排/校验/降级/状态迁移/编排骨架说明意图(不译代码),参考标准岗位 ponytail 风格:
   - 方法级 Javadoc 说意图不说实现(`/** 分页骨架:normalize → count → 空页短路 → offset → 加载 → 返回 Page。 */`)
   - 设计理由说明"为什么"+量化收益(`// 一次查询覆盖计数+编码,消除 400ms+ 重复 DB 调用。`)
   - 多步骤编号骨架(`// 1. 校验... // 2. 批量取... // 3. 组装...`)
   - 字段级语义说明默认值/已知缺口 TODO
42. `建议` 注释用 `TODO`(待办+时间)/`FIXME`(有问题及时修)标记;无用代码直接删不注释掉;保持注释与代码同步(错误注释比无注释更严重)。`避免` 不必要的注释(自解释代码);`避免` 错误/过时注释。
43. `必须` 注释禁内部代号(HR-xx/Phase/AC/ARC 等),用业务语言(memory `source-code-comments-no-internal-codes`)。

## 八、参考标杆与 MySQL

44. `建议` 参考标准岗位(standardposition):Req→Convertor.toQuery→领域 Query(`@Accessors(chain)`)→Service(1 参)→Repository(1 参)→`Page<T>`→Convertor.to*VOPage→`PageVO`;注释密度 Query/Command Impl 几乎每方法有 Javadoc + 设计理由;Convertor 命名 `Api{Module}Convertor` 放 `api/converter/{module}/` `@Component`。
45. `必须` MySQL 规约(阿里):表名 snake_case 无复数;主键自增 `BIGINT`;小数用 `DECIMAL` 禁 `FLOAT`/`DOUBLE`;`VARCHAR(N)` N 是字符数;`WHERE` 条件禁函数/表达式作用于字段(`YEAR(create_time)=2024` 改 `create_time BETWEEN`);`LIMIT` 必须配合 `ORDER BY`,深分页(>1000)改游标分页;禁外键级联(应用层维护);`UPDATE`/`DELETE` 必须有 `WHERE` 走索引;单表索引≤5 遵循最左前缀。hrod_plus 库(MySQL 8.0)建表统一 `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`(memory `mysql-charset-utf8mb4-0900-ai-ci`)。

## 适用与豁免

- **适用**:hrod-plus 全仓后端 Java 新增/修改代码
- **存量治理**:按重构方案分批(参数对象化/分页基类/注释/换行)
- **豁免**:纯 typo / 注释文字调整 / 纯重命名(编译通过即可) / 一次性临时脚本 / 修改外部开源代码遵守原规范
- **例外**:规则例外应极少,经充分考虑有充足理由可适当违背(如修改第三方代码保持风格统一)
- **跨模块**:通用基建(BaseReq)放 common 供复用;模块专用(排序枚举)放 domain;其他模块是否对齐由该模块负责人决定
